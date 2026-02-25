import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Article } from '../articles/entities/article.entity';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { DailyAnalytics } from './entities/daily-analytics.entity';
import { ReadLog } from './entities/read-log.entity';

@Injectable()
export class AnalyticsService {
  /** Initializes the AnalyticsService with the Article repository */
  constructor(
    @InjectRepository(Article) private readonly articleRepository: Repository<Article>,
    @InjectRepository(ReadLog) private readonly readLogRepository: Repository<ReadLog>,
  ) {}

  /** Retrieves paginated article performance metrics for a specific author, including total views */
  async getAuthorPerformance(authorId: string, query: DashboardQueryDto) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const qb = this.articleRepository.createQueryBuilder('article')
      .leftJoin(DailyAnalytics, 'analytics', 'analytics.articleId = article.id')
      .select(['article.title', 'article.createdAt'])
      .addSelect('COALESCE(SUM(analytics.viewCount), 0)', 'totalViews')
      .where('article.authorId = :authorId', { authorId })
      .andWhere('article.deletedAt IS NULL')
      .groupBy('article.id')
      .orderBy('article.createdAt', 'DESC')
      .offset(skip)
      .limit(limit);

    const [items, total] = await Promise.all([
      qb.getRawMany(),
      this.articleRepository.count({ where: { authorId, deletedAt: IsNull() } }),
    ]);

    return {
      Success: true,
      Message: 'Author performance metrics retrieved successfully',
      Object: items.map((item) => ({
        Title: item.article_title,
        CreatedAt: item.article_createdAt,
        TotalViews: Number(item.totalViews),
      })),
      PageNumber: page,
      PageSize: limit,
      TotalSize: total,
      Errors: null,
    };
  }

  /** Logs a read event for an article */
  async trackArticleRead(articleId: string, ip: string, readerId?: string) {
    await this.readLogRepository.save({
      articleId,
      ip,
      readerId,
      readAt: new Date(),
    });
  }
}