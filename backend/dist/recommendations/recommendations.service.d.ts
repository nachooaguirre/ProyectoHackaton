import { RecommendationFiltersDto } from './dto/recommendation-filters.dto';
import { MovieRecommendationDto } from './dto/movie-recommendation.dto';
export declare class RecommendationsService {
    private readonly openai;
    private readonly omdbApiKey;
    private readonly tmdbApiKey;
    private readonly youtubeApiKey;
    getRecommendations(filters: RecommendationFiltersDto): Promise<MovieRecommendationDto[]>;
    private buildUserPrompt;
}
