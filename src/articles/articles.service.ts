import { Injectable, ForbiddenException, NotFoundException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article, ArticleStatus } from './entities/article.entity';
import { User } from '../users/entities/user.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { SearchArticleDto } from './dto/search-article.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export interface ArticleViewDto {
  id: string;
  title: string;
  content: string;
  category: string;
  status: ArticleStatus;
  authorId: string;
  authorName?: string;
  createdAt: Date;
}

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectQueue('read-log') private readonly readLogQueue: Queue,
  ) {}

  private toView(article: Article): ArticleViewDto {
    return {
      id: article.id,
      title: article.title,
      content: article.content,
      category: article.category,
      status: article.status,
      authorId: article.authorId,
      authorName: article.author?.name,
      createdAt: article.createdAt,
    };
  }

  async create(createDto: CreateArticleDto, authorId: string) {
    const user = await this.userRepository.findOne({ where: { id: authorId } });
    if (!user) throw new NotFoundException('Author not found');
    if (user.role !== 'author') throw new ForbiddenException('Only authors can create articles');

    const article = this.articleRepository.create({ ...createDto, authorId });
    const saved = await this.articleRepository.save(article);
    saved.author = user;
    return this.toView(saved);
  }

  async findAll(query: SearchArticleDto) {
    const { category, author, q, page = 1, size = 10 } = query;
    const qb = this.articleRepository.createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author')
      .where('article.status = :status', { status: ArticleStatus.Published })
      .andWhere('article.deleted_at IS NULL');

    if (category) qb.andWhere('article.category = :category', { category });
    if (author) qb.andWhere('LOWER(author.name) LIKE :author', { author: `%${author.toLowerCase()}%` });
    if (q) qb.andWhere('article.title LIKE :q', { q: `%${q}%` });

    const [items, total] = await qb
      .orderBy('article.createdAt', 'DESC')
      .skip((page - 1) * size)
      .take(size)
      .getManyAndCount();

    return {
      items: items.map((a) => this.toView(a)),
      page,
      size,
      total,
    };
  }

  async findOne(id: string, readerId?: string) {
    const article = await this.articleRepository.findOne({ where: { id }, relations: ['author'] });
    if (!article || article.deletedAt) {
      throw new NotFoundException('News article no longer available');
    }

    if (article.status === ArticleStatus.Draft && article.authorId !== readerId) {
      throw new NotFoundException('News article no longer available');
    }

    try {
      await this.readLogQueue.add('create', { articleId: id, readerId: readerId ?? null });
    } catch (e) {
      // don't block on queue errors
    }

    return this.toView(article);
  }

  async findMine(authorId: string, page = 1, size = 10, includeDeleted = false) {
    const qb = this.articleRepository.createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author')
      .where('article.author_id = :authorId', { authorId });

    if (!includeDeleted) qb.andWhere('article.deleted_at IS NULL');

    const [items, total] = await qb
      .orderBy('article.createdAt', 'DESC')
      .skip((page - 1) * size)
      .take(size)
      .getManyAndCount();

    return { items: items.map((a) => this.toView(a)), page, size, total };
  }

  async update(id: string, updateDto: UpdateArticleDto, authorId: string) {
    const article = await this.articleRepository.findOne({ where: { id } });
    if (!article) throw new NotFoundException('Article not found');
    if (article.authorId !== authorId) throw new ForbiddenException('Forbidden');

    Object.assign(article, updateDto);
    const saved = await this.articleRepository.save(article);
    return this.toView(saved);
  }

  async remove(id: string, authorId: string) {
    const article = await this.articleRepository.findOne({ where: { id } });
    if (!article) throw new NotFoundException('Article not found');
    if (article.authorId !== authorId) throw new ForbiddenException('Forbidden');

    await this.articleRepository.softDelete(id);
    return { success: true };
  }
}
