import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import fetch from 'cross-fetch';
import { RecommendationFiltersDto } from './dto/recommendation-filters.dto';
import { MovieRecommendationDto } from './dto/movie-recommendation.dto';

@Injectable()
export class RecommendationsService {
  private readonly openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  private readonly omdbApiKey = process.env.OMDB_API_KEY;
  private readonly tmdbApiKey = process.env.TMDB_API_KEY;
  private readonly youtubeApiKey = process.env.YOUTUBE_API_KEY;

  async getRecommendations(filters: RecommendationFiltersDto): Promise<MovieRecommendationDto[]> {
    const count = Math.max(1, Math.min(50, filters.count ?? 5));

    const systemPrompt =
      'Eres un asistente que recomienda películas. Devuelve un JSON con este formato exacto: {"movies":[{"title":"","year":"","reason":""}]} sin texto adicional.';

    const userPrompt = this.buildUserPrompt(filters, count);

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const messageContent = completion.choices[0]?.message?.content ?? '{"movies":[]}';
    let movies: Array<{ title: string; year?: string; reason?: string }>; // from model
    try {
      const parsed = JSON.parse(messageContent);
      movies = Array.isArray(parsed.movies) ? parsed.movies : [];
    } catch {
      movies = [];
    }

    // Enrichment pipeline (OMDb first, TMDb fallback)
    const enriched = await Promise.all(
      movies.slice(0, count).map(async (m) => {
        let base: MovieRecommendationDto = { title: m.title, year: m.year, reason: m.reason };

        // Try OMDb if available
        if (this.omdbApiKey) {
          try {
            const url = `https://www.omdbapi.com/?apikey=${this.omdbApiKey}&t=${encodeURIComponent(m.title)}`;
            const res = await fetch(url);
            const data = (await res.json()) as any;
            if (data && data.Response !== 'False') {
              base = {
                title: data.Title ?? base.title,
                year: data.Year ?? base.year,
                reason: base.reason,
                imdbId: data.imdbID,
                poster: data.Poster && data.Poster !== 'N/A' ? data.Poster : undefined,
                rating:
                  Array.isArray(data.Ratings) && data.Ratings.length > 0
                    ? data.Ratings[0].Value
                    : undefined,
              };
            }
          } catch {}
        }

        // Fallback to TMDb for poster if missing and TMDb key provided
        if ((!base.poster || base.poster === 'N/A') && this.tmdbApiKey) {
          try {
            const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${this.tmdbApiKey}&query=${encodeURIComponent(
              m.title,
            )}${m.year ? `&year=${encodeURIComponent(m.year)}` : ''}&include_adult=false&language=es-ES`;
            const res = await fetch(searchUrl);
            const tmdb = (await res.json()) as any;
            const first = Array.isArray(tmdb?.results) && tmdb.results.length > 0 ? tmdb.results[0] : null;
            if (first && first.poster_path) {
              base.poster = `https://image.tmdb.org/t/p/w342${first.poster_path}`;
            }
            if (!base.rating && typeof first?.vote_average === 'number') {
              base.rating = String(first.vote_average);
            }
            // Fetch trailer (YouTube) if possible
            if (first?.id) {
              try {
                const videosUrl = `https://api.themoviedb.org/3/movie/${first.id}/videos?api_key=${this.tmdbApiKey}&language=es-ES`;
                const vres = await fetch(videosUrl);
                const vdata = (await vres.json()) as any;
                const yt = (vdata?.results || []).find(
                  (v: any) => v.site === 'YouTube' && v.type === 'Trailer' && v.key,
                ) || (vdata?.results || []).find((v: any) => v.site === 'YouTube' && v.key);
                if (yt?.key) {
                  base.trailerUrl = `https://www.youtube.com/embed/${yt.key}`;
                }
              } catch {}
            }

            // Watch providers (region/US/AR fallback)
            if (first?.id) {
              try {
                const provUrl = `https://api.themoviedb.org/3/movie/${first.id}/watch/providers?api_key=${this.tmdbApiKey}`;
                const pres = await fetch(provUrl);
                const pdata = (await pres.json()) as any;
                const region = (filters as any)?.region?.toUpperCase?.() || (process.env.TMDB_REGION || 'AR').toUpperCase();
                const entry = pdata?.results?.[region] || pdata?.results?.US || pdata?.results?.AR;
                if (entry) {
                  base.watchLink = entry.link;
                  const pack: { name: string; logo: string }[] = [];
                  const seen = new Set<string>();
                  const take = (arr?: any[]) =>
                    Array.isArray(arr)
                      ? arr.slice(0, 6).forEach((p: any) => {
                          if (p?.provider_name && p?.logo_path && !seen.has(p.provider_name)) {
                            seen.add(p.provider_name);
                            pack.push({
                              name: p.provider_name,
                              logo: `https://image.tmdb.org/t/p/w92${p.logo_path}`,
                            });
                          }
                        })
                      : undefined;
                  take(entry.flatrate);
                  if (pack.length < 6) take(entry.rent);
                  if (pack.length < 6) take(entry.buy);
                  if (pack.length < 6) take(entry.free);
                  if (pack.length < 6) take(entry.ads);
                  base.providers = pack.length ? pack : undefined;
                }
              } catch {}
            }
          } catch {}
        }

        // Fallback to YouTube Data API if still no trailer
        if (!base.trailerUrl && this.youtubeApiKey) {
          try {
            const query = `${m.title} ${m.year ? ` ${m.year}` : ''} trailer oficial`;
            const yurl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=1&q=${encodeURIComponent(
              query,
            )}&key=${this.youtubeApiKey}`;
            const yres = await fetch(yurl);
            const ydata = (await yres.json()) as any;
            const id = ydata?.items?.[0]?.id?.videoId;
            if (id) {
              base.trailerUrl = `https://www.youtube.com/embed/${id}`;
            }
          } catch {}
        }

        return base;
      }),
    );

    return enriched;
  }

  private buildUserPrompt(filters: RecommendationFiltersDto, count: number): string {
    const parts: string[] = [];
    if (filters.prompt) parts.push(`Preferencias: ${filters.prompt}`);
    if (filters.genres?.length) parts.push(`Géneros: ${filters.genres.join(', ')}`);
    if (filters.actors?.length) parts.push(`Actores: ${filters.actors.join(', ')}`);
    if (filters.directors?.length) parts.push(`Directores: ${filters.directors.join(', ')}`);
    if (filters.minYear || filters.maxYear)
      parts.push(`Años: ${filters.minYear ?? ''}-${filters.maxYear ?? ''}`);
    if (filters.minRating) parts.push(`Rating mínimo: ${filters.minRating}`);
    parts.push(`Cantidad: ${count}`);

    return `Recomienda exactamente ${count} películas según estas condiciones. Responde solo con JSON:
${parts.join('\n')}`;
  }
}


