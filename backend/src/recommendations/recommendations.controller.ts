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
      const rawMessage: string = typeof err?.message === 'string' ? err.message : '';
      const sanitizedMessage = /Incorrect API key/i.test(rawMessage)
        ? 'OpenAI API key inválida o faltante.'
        : 'No se pudieron generar recomendaciones.';
      const status = err?.status === 401 ? HttpStatus.UNAUTHORIZED : HttpStatus.BAD_REQUEST;
      throw new HttpException({ message: sanitizedMessage }, status);
    }
  }
}


