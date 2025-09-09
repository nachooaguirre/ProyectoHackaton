export class RecommendationFiltersDto {
  prompt?: string;
  genres?: string[];
  actors?: string[];
  directors?: string[];
  minYear?: number;
  maxYear?: number;
  minRating?: number; // IMDb o general
  count?: number; // 1, 5, 10, etc.
  region?: string; // Código de país TMDb (AR, US, ES, MX, etc.)
}


