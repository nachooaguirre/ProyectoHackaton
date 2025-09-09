import { Body, Controller, HttpException, HttpStatus, Post } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service.js';
import { RecommendationFiltersDto } from './dto/recommendation-filters.dto';

@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Post()
  async create(@Body() body: RecommendationFiltersDto) {
    try {
      const result = await this.recommendationsService.getRecommendations(body);
      return { movies: result };
    } catch (err: any) {
      throw new HttpException(
        { message: err?.message ?? 'Failed to generate recommendations' },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}


