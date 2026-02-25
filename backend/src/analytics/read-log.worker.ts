import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReadLog } from './entities/read-log.entity';
import { Article } from '../articles/entities/article.entity';
import { User } from '../users/entities/user.entity';
import { ConfigService } from '@nestjs/config';

/** Same reader (user or guest) + same article within this window = one log only. */
const DEDUPE_WINDOW_SECONDS = 60;

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
      async (job: Job<{ articleId: string; readerId: string | null; guestId?: string | null }>) => {
        const { articleId, readerId, guestId } = job.data;
        try {
          const article = await this.articleRepo.findOne({ where: { id: articleId } });
          if (!article) {
            this.logger.warn(`Article not found for read-log: ${articleId}`);
            return;
          }

          const since = new Date(Date.now() - DEDUPE_WINDOW_SECONDS * 1000);
          const qb = this.readLogRepo
            .createQueryBuilder('rl')
            .where('rl.article_id = :articleId', { articleId })
            .andWhere('rl.read_at > :since', { since });

          if (readerId != null && readerId !== '') {
            qb.andWhere('rl.reader_id = :readerId', { readerId });
          } else if (guestId != null && guestId !== '') {
            qb.andWhere('rl.guest_id = :guestId', { guestId });
          } else {
            qb.andWhere('rl.reader_id IS NULL').andWhere('rl.guest_id IS NULL');
          }

          const existing = await qb.take(1).getOne();
          if (existing) {
            return; // already logged this read in the window; skip
          }

          const entry: Partial<ReadLog> = {
            articleId,
            readerId: readerId ?? null,
            guestId: guestId ?? null,
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
