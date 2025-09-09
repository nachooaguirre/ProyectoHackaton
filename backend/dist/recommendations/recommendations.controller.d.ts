import { RecommendationsService } from './recommendations.service.js';
import { RecommendationFiltersDto } from './dto/recommendation-filters.dto';
export declare class RecommendationsController {
    private readonly recommendationsService;
    constructor(recommendationsService: RecommendationsService);
    create(body: RecommendationFiltersDto): Promise<{
        movies: import("./dto/movie-recommendation.dto.js").MovieRecommendationDto[];
    }>;
}
