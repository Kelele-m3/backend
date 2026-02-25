import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReadLog } from './entities/read-log.entity';
import { DailyAnalytics } from './entities/daily-analytics.entity';
import { ConfigService } from '@nestjs/config';

type AggregateJobData = { date?: string };

@Injectable()
export class DailyAggWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DailyAggWorker.name);
  private worker: Worker | null = null;

  constructor(
    @InjectRepository(ReadLog)
    private readonly readLogRepo: Repository<ReadLog>,
    @InjectRepository(DailyAnalytics)
    private readonly dailyRepo: Repository<DailyAnalytics>,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    const connection = {
      host: String(this.configService.get('REDIS_HOST') ?? '127.0.0.1'),
      port: Number(this.configService.get('REDIS_PORT') ?? 6379),
      password: this.configService.get('REDIS_PASSWORD') as string | undefined,
    };

    this.worker = new Worker(
      'daily-aggregate',
      async (job: Job<AggregateJobData>) => {
        const targetDateStr = job.data?.date ?? this.yesterdayGMTString();
        this.logger.log(`Running daily aggregation for ${targetDateStr}`);

        const [year, month, day] = targetDateStr.split('-').map((v) => Number(v));
        const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
        const end = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0));

        const qb = this.readLogRepo.createQueryBuilder('rl')
          .select('rl.article_id', 'articleId')
          .addSelect('COUNT(1)', 'cnt')
          .where('rl.read_at >= :start AND rl.read_at < :end', { start: start.toISOString(), end: end.toISOString() })
          .groupBy('rl.article_id');

        const rows: Array<{ articleId: string; cnt: string }> = await qb.getRawMany();

        for (const r of rows) {
          const articleId = r.articleId;
          const cnt = Number(r.cnt);
          try {
            await this.dailyRepo.upsert(
              { articleId, date: targetDateStr, viewCount: cnt } as any,
              ['articleId', 'date'],
            );
          } catch (e) {
            this.logger.error(`Failed upserting daily analytics for ${articleId} ${targetDateStr}`, e as any);
            throw e;
          }
        }

        this.logger.log(`Daily aggregation complete for ${targetDateStr} (${rows.length} articles)`);
      },
      { connection },
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error(`DailyAgg job failed ${job?.id}`, err as any);
    });

    this.logger.log('DailyAgg worker started');
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
      this.logger.log('DailyAgg worker stopped');
    }
  }

  private yesterdayGMTString(): string {
    const now = new Date();
    const utcYear = now.getUTCFullYear();
    const utcMonth = now.getUTCMonth();
    const utcDate = now.getUTCDate();
    const yest = new Date(Date.UTC(utcYear, utcMonth, utcDate - 1, 0, 0, 0));
    const yyyy = yest.getUTCFullYear();
    const mm = String(yest.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(yest.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

}
