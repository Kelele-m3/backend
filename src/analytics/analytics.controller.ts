import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Analytics')
@Controller('author/dashboard')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /** Endpoint to retrieve author performance metrics */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('author')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get author performance metrics' })
  async getAuthorDashboard(@Request() req, @Query() query: DashboardQueryDto) {
    const authorId = req.user.sub ?? req.user.id;
    return this.analyticsService.getAuthorPerformance(authorId, query);
  }
}