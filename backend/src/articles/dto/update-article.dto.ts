import { IsString, IsEnum, IsOptional, MinLength, MaxLength, IsIn, } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArticleStatus } from '../entities/article.entity';

const CATEGORIES = ['Politics', 'Tech', 'Sports', 'Health'] as const;

export class UpdateArticleDto {
  @ApiPropertyOptional({ description: 'Article title', maxLength: 150 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  title?: string;

  @ApiPropertyOptional({ description: 'Article content', minLength: 50 })
  @IsOptional()
  @IsString()
  @MinLength(50)
  content?: string;

  @ApiPropertyOptional({ description: 'Article category', enum: CATEGORIES })
  @IsOptional()
  @IsString()
  @IsIn([...CATEGORIES])
  category?: string;

  @ApiPropertyOptional({ description: 'Article status', enum: ArticleStatus })
  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus;
}
