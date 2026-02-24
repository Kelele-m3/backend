import {
  IsString,
  IsEnum,
  MinLength,
  MaxLength,
  IsIn,
} from 'class-validator';

const CATEGORIES = ['Politics', 'Tech', 'Sports', 'Health'] as const;

export class CreateArticleDto {
  @IsString()
  @MinLength(1, { message: 'Title is required' })
  @MaxLength(150, { message: 'Title must be 1-150 characters' })
  title: string;

  @IsString()
  @MinLength(50, { message: 'Content must be at least 50 characters' })
  content: string;

  @IsString()
  @IsIn([...CATEGORIES], { message: 'Category must be one of: Politics, Tech, Sports, Health' })
  category: string;
}
