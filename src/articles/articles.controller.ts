import { Controller, Post, Body, Req, Get, Query, Param, Put, Delete, UseGuards, } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { SearchArticleDto } from './dto/search-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@ApiTags('Articles')
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  private baseResponse(
    success: boolean,
    message: string,
    object: any = null,
    errors?: string[],
  ) {
    return {
      Success: success,
      Message: message,
      Object: object,
      Errors: errors ?? null,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('author')
  @ApiBearerAuth()
  async create(@Body() dto: CreateArticleDto, @Req() req: any) {
    const user = req.user;
    const userId = user?.sub ?? user?.id;
    const role = user?.role;
    if (!userId || role !== 'author') {
      return this.baseResponse(false, 'Forbidden', null, [
        'Only authors can create articles',
      ]);
    }

    try {
      const created = await this.articlesService.create(dto, userId);
      return this.baseResponse(true, 'Article created', created);
    } catch (e: any) {
      console.error(e);
      return this.baseResponse(false, e.message ?? 'Error', null, [e.message]);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Search published articles' })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Exact category (Politics|Tech|Sports|Health)' })
  @ApiQuery({ name: 'author', required: false, type: String, description: 'Partial author name' })
  @ApiQuery({ name: 'q', required: false, type: String, description: 'Keyword search in title' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'size', required: false, type: Number })
  async findAll(@Query() query: SearchArticleDto) {
    try {
      const res = await this.articlesService.findAll(query);
      return {
        Success: true,
        Message: 'OK',
        Object: res.items,
        PageNumber: res.page,
        PageSize: res.size,
        TotalSize: res.total,
        Errors: null,
      };
    } catch (e: any) {
      console.error(e);
      return this.baseResponse(false, e.message ?? 'Error', null, [e.message]);
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('author')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get author's articles (filters like search)" })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Exact category (Politics|Tech|Sports|Health)' })
  @ApiQuery({ name: 'q', required: false, type: String, description: 'Keyword search in title' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'size', required: false, type: Number })
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean })
  async findMine(@Query() query: SearchArticleDto, @Query('includeDeleted') includeDeleted: string, @Req() req: any) {
    const user = req.user;
    const userId = user?.sub ?? user?.id;
    const role = user?.role;
    if (!userId || role !== 'author') {
      return this.baseResponse(false, 'Forbidden', null, ['Only authors can access this resource']);
    }
    const p = query.page ?? 1;
    const s = query.size ?? 10;
    const include = includeDeleted === 'true';
    try {
      const res = await this.articlesService.findMine(userId, { ...query, page: p, size: s }, include);
      return {
        Success: true,
        Message: 'OK',
        Object: res.items,
        PageNumber: res.page,
        PageSize: res.size,
        TotalSize: res.total,
        Errors: null,
      };
    } catch (e: any) {
        return this.baseResponse(false, e.message ?? 'Error', null, [e.message]);
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findOne(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    const userId = user?.sub ?? user?.id ?? null;
    try {
      const article = await this.articlesService.findOne(id, userId);
      return this.baseResponse(true, 'OK', article);
    } catch (e: any) {
      console.error(e);
      return this.baseResponse(false, e.message ?? 'Error', null, [e.message]);
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('author')
  @ApiBearerAuth()
  async update(@Param('id') id: string, @Body() dto: UpdateArticleDto, @Req() req: any) {
    const user = req.user;
    const userId = user?.sub ?? user?.id;
    const role = user?.role;
    if (!userId || role !== 'author') {
      return this.baseResponse(false, 'Forbidden', null, [
        'Only authors can update articles',
      ]);
    }

    try {
      const updated = await this.articlesService.update(id, dto, userId);
      return this.baseResponse(true, 'Article updated', updated);
    } catch (e: any) {
      console.error(e);
      return this.baseResponse(false, e.message ?? 'Error', null, [e.message]);
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('author')
  @ApiBearerAuth()
  async remove(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    const userId = user?.sub ?? user?.id;
    const role = user?.role;
    if (!userId || role !== 'author') {
      return this.baseResponse(false, 'Forbidden', null, [
        'Only authors can delete articles',
      ]);
    }

    try {
      await this.articlesService.remove(id, userId);
      return this.baseResponse(true, 'Article deleted');
    } catch (e: any) {
      console.error(e);
      return this.baseResponse(false, e.message ?? 'Error', null, [e.message]);
    }
  }
}
