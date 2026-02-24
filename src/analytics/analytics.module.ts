import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReadLog } from './entities/read-log.entity';
import { DailyAnalytics } from './entities/daily-analytics.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReadLog, DailyAnalytics]),
  ],
  exports: [TypeOrmModule],
})
export class AnalyticsModule {}
