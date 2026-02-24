import {
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
  MaxLength,
  IsIn,
} from 'class-validator';
import { ArticleStatus } from '../entities/article.entity';

const CATEGORIES = ['Politics', 'Tech', 'Sports', 'Health'] as const;

export class UpdateArticleDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(50)
  content?: string;

  @IsOptional()
  @IsString()
  @IsIn([...CATEGORIES])
  category?: string;

  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus;
}
