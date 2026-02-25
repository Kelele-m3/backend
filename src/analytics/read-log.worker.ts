import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReadLog } from './entities/read-log.entity';
import { Article } from '../articles/entities/article.entity';
import { User } from '../users/entities/user.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ReadLogWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReadLogWorker.name);
  private worker: Worker | null = null;

  constructor(
    @InjectRepository(ReadLog)
    private readonly readLogRepo: Repository<ReadLog>,
    @InjectRepository(Article)
    private readonly articleRepo: Repository<Article>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    const connection = {
      host: String(this.configService.get('REDIS_HOST') ?? '127.0.0.1'),
      port: Number(this.configService.get('REDIS_PORT') ?? 6379),
      password: this.configService.get('REDIS_PASSWORD') as string | undefined,
    };

    this.worker = new Worker(
      'read-log',
      async (job: Job<{ articleId: string; readerId: string | null }>) => {
        const { articleId, readerId } = job.data;
        try {
          const article = await this.articleRepo.findOne({ where: { id: articleId } });
          if (!article) {
            this.logger.warn(`Article not found for read-log: ${articleId}`);
            return;
          }

          const entry: Partial<ReadLog> = {
            articleId,
            readerId: readerId ?? null,
          };

          await this.readLogRepo.save(this.readLogRepo.create(entry));
        } catch (e) {
          this.logger.error('Failed to persist read-log', e as any);
          throw e;
        }
      },
      { connection },
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error(`ReadLog job failed ${job?.id}`, err as any);
    });

    this.logger.log('ReadLog worker started');
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
      this.logger.log('ReadLog worker stopped');
    }
  }
}
