import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReadLog } from './entities/read-log.entity';
import { DailyAnalytics } from './entities/daily-analytics.entity';
import { BullModule } from '@nestjs/bullmq';
import { ReadLogWorker } from './read-log.worker';
import { DailyAggWorker } from './daily-agg.worker';
import { Article } from '../articles/entities/article.entity';
import { User } from '../users/entities/user.entity';
import { ArticlesController } from 'src/articles/articles.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'read-log' }),
    BullModule.registerQueue({ name: 'daily-aggregate' }),
    TypeOrmModule.forFeature([ReadLog, DailyAnalytics, Article, User]),
  ],
  providers: [ReadLogWorker, DailyAggWorker, AnalyticsService],
  controllers: [AnalyticsController],
  exports: [TypeOrmModule],
})
export class AnalyticsModule {}
