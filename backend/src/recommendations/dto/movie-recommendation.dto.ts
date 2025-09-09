export class MovieRecommendationDto {
  title!: string;
  year?: string;
  reason?: string;
  imdbId?: string;
  poster?: string;
  rating?: string;
  trailerUrl?: string;
  watchLink?: string; // TMDb deeplink for region
  providers?: { name: string; logo: string }[]; // platform logos
}


