import { IsString, MinLength, MaxLength, IsIn, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArticleStatus } from '../entities/article.entity';

const CATEGORIES = ['Politics', 'Tech', 'Sports', 'Health'] as const;

export class CreateArticleDto {
  @ApiProperty({ description: 'Article title', maxLength: 150 })
  @IsString()
  @MinLength(1, { message: 'Title is required' })
  @MaxLength(150, { message: 'Title must be 1-150 characters' })
  title: string;

  @ApiProperty({ description: 'Article content', minLength: 50 })
  @IsString()
  @MinLength(50, { message: 'Content must be at least 50 characters' })
  content: string;

  @ApiProperty({ description: 'Article category', enum: CATEGORIES })
  @IsString()
  @IsIn([...CATEGORIES], { message: 'Category must be one of: Politics, Tech, Sports, Health' })
  category: string;

  @ApiPropertyOptional({ description: 'Article status', enum: ArticleStatus })
  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus;
}
