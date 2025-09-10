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
<<<<<<< HEAD
  platforms?: string[]; // Nombres de plataformas deseadas (ej. Netflix, Amazon Prime Video)
=======
>>>>>>> 0111ec8a9e3c8467df8a07c3768e8eb147391359
}


