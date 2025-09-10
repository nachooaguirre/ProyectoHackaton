import { RecommendationFiltersDto } from './dto/recommendation-filters.dto';
import { MovieRecommendationDto } from './dto/movie-recommendation.dto';
export declare class RecommendationsService {
    private readonly openai;
    private readonly omdbApiKey;
    private readonly tmdbApiKey;
    private readonly youtubeApiKey;
<<<<<<< HEAD
    private readonly normalizeProvider;
=======
>>>>>>> 0111ec8a9e3c8467df8a07c3768e8eb147391359
    getRecommendations(filters: RecommendationFiltersDto): Promise<MovieRecommendationDto[]>;
    private buildUserPrompt;
}
