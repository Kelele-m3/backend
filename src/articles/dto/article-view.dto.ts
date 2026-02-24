import { ApiProperty } from '@nestjs/swagger';
import { ArticleStatus, Article } from '../entities/article.entity';
import { plainToInstance } from 'class-transformer';

export class ArticleViewDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  category: string;

  @ApiProperty({ enum: ArticleStatus })
  status: ArticleStatus;

  @ApiProperty()
  authorId: string;

  @ApiProperty({ required: false })
  authorName?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ required: false })
  deletedAt: null | Date;

  static fromEntity(article: Article): ArticleViewDto {
    const plain = {
      id: article.id,
      title: article.title,
      content: article.content,
      category: article.category,
      status: article.status,
      authorId: article.authorId,
      authorName: article.author?.name,
      createdAt: article.createdAt,
      deletedAt: article.deletedAt,
    };

    return plainToInstance(ArticleViewDto, plain);
  }
}
