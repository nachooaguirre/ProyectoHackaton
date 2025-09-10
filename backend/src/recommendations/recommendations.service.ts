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
  private readonly normalizeProvider = (name: string): string => {
    const slug = (name || '')
      .toLowerCase()
      .replace(/\+/g, 'plus')
      .replace(/[^a-z0-9]/g, '');
    const aliases: Record<string, string> = {
      primevideo: 'amazonprimevideo',
      amazonprime: 'amazonprimevideo',
      hbo: 'hbomax',
      max: 'hbomax',
      hbomax: 'hbomax',
      disney: 'disneyplus',
      disneyplus: 'disneyplus',
      paramount: 'paramountplus',
      paramountplus: 'paramountplus',
      appletv: 'appletvplus',
      appletvplus: 'appletvplus',
    };
    return aliases[slug] || slug;
  };

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
    const selected = Array.isArray((filters as any)?.platforms)
      ? ((filters as any).platforms as string[]).map((s) => this.normalizeProvider(s))
      : [];

    const enriched = await Promise.all(
      movies.slice(0, count).map(async (m) => {
        let base: MovieRecommendationDto = { title: m.title, year: m.year, reason: m.reason };

        // OMDb for quick metadata
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
                poster: data.Poster && data.Poster !== 'N/A' ? data.Poster : base.poster,
                rating:
                  Array.isArray(data.Ratings) && data.Ratings.length > 0
                    ? data.Ratings[0].Value
                    : base.rating,
              };
            }
          } catch {}
        }

        // TMDb: search movie, else TV; fetch poster/trailer/providers regardless of OMDb
        if (this.tmdbApiKey) {
          try {
            const region = (filters as any)?.region?.toUpperCase?.() || (process.env.TMDB_REGION || 'AR').toUpperCase();

            const movieSearch = `https://api.themoviedb.org/3/search/movie?api_key=${this.tmdbApiKey}&query=${encodeURIComponent(
              m.title,
            )}${m.year ? `&year=${encodeURIComponent(m.year)}` : ''}&include_adult=false&language=es-ES`;
            let res = await fetch(movieSearch);
            let data = (await res.json()) as any;
            let first = Array.isArray(data?.results) && data.results.length > 0 ? data.results[0] : null;
            let media: 'movie' | 'tv' | null = first ? 'movie' : null;

            if (!first) {
              const tvSearch = `https://api.themoviedb.org/3/search/tv?api_key=${this.tmdbApiKey}&query=${encodeURIComponent(
                m.title,
              )}&include_adult=false&language=es-ES`;
              res = await fetch(tvSearch);
              data = (await res.json()) as any;
              first = Array.isArray(data?.results) && data.results.length > 0 ? data.results[0] : null;
              media = first ? 'tv' : null;
            }

            if (first) {
              if (first.poster_path && (!base.poster || base.poster === 'N/A')) {
                base.poster = `https://image.tmdb.org/t/p/w342${first.poster_path}`;
              }
              if (!base.rating && typeof first?.vote_average === 'number') {
                base.rating = String(first.vote_average);
              }

              // Videos
              try {
                const videosUrl = `https://api.themoviedb.org/3/${media === 'tv' ? 'tv' : 'movie'}/${first.id}/videos?api_key=${this.tmdbApiKey}&language=es-ES`;
                const vres = await fetch(videosUrl);
                const vdata = (await vres.json()) as any;
                const yt = (vdata?.results || []).find(
                  (v: any) => v.site === 'YouTube' && v.type === 'Trailer' && v.key,
                ) || (vdata?.results || []).find((v: any) => v.site === 'YouTube' && v.key);
                if (yt?.key) base.trailerUrl = `https://www.youtube.com/embed/${yt.key}`;
              } catch {}

              // Providers
              try {
                const provUrl = `https://api.themoviedb.org/3/${media === 'tv' ? 'tv' : 'movie'}/${first.id}/watch/providers?api_key=${this.tmdbApiKey}`;
                const pres = await fetch(provUrl);
                const pdata = (await pres.json()) as any;
                const entry = pdata?.results?.[region] || pdata?.results?.US || pdata?.results?.AR;
                if (entry) {
                  base.watchLink = entry.link;
                  const pack: { name: string; logo: string; type: 'flatrate' | 'rent' | 'buy' | 'free' | 'ads' }[] = [];
                  const seen = new Set<string>();
                  const take = (arr?: any[], type?: 'flatrate' | 'rent' | 'buy' | 'free' | 'ads') =>
                    Array.isArray(arr)
                      ? arr.slice(0, 8).forEach((p: any) => {
                          if (p?.provider_name && p?.logo_path && !seen.has(p.provider_name)) {
                            seen.add(p.provider_name);
                            pack.push({ name: p.provider_name, logo: `https://image.tmdb.org/t/p/w92${p.logo_path}`, type: type ?? 'flatrate' });
                          }
                        })
                      : undefined;
                  take(entry.flatrate, 'flatrate');
                  if (pack.length < 8) take(entry.free, 'free');
                  if (pack.length < 8) take(entry.ads, 'ads');
                  if (pack.length < 8) take(entry.rent, 'rent');
                  if (pack.length < 8) take(entry.buy, 'buy');
                  base.providers = pack.length ? pack : undefined;
                }
              } catch {}
            }
          } catch {}
        }

        // YouTube API fallback
        if (!base.trailerUrl && this.youtubeApiKey) {
          try {
            const query = `${m.title} ${m.year ? ` ${m.year}` : ''} trailer oficial`;
            const yurl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=1&q=${encodeURIComponent(
              query,
            )}&key=${this.youtubeApiKey}`;
            const yres = await fetch(yurl);
            const ydata = (await yres.json()) as any;
            const id = ydata?.items?.[0]?.id?.videoId;
            if (id) base.trailerUrl = `https://www.youtube.com/embed/${id}`;
          } catch {}
        }

        // If platforms filter active, enforce here strictly as well
        if (selected.length) {
          const allowedTypes: Array<'flatrate' | 'ads' | 'free'> = ['flatrate', 'ads', 'free'];
          const names = (base.providers || [])
            .filter((p: any) => allowedTypes.includes(p.type))
            .map((p: any) => this.normalizeProvider(p.name));
          const ok = names.some((n) => selected.includes(n));
          if (!ok) return null as any;
        }
        return base;
      }),
    );

    // If platforms filter present, remove those without matching providers (normalized compare)
    const finalList = selected.length
      ? enriched.filter((m: MovieRecommendationDto | null) => {
          if (!m) return false;
          const allowedTypes: Array<'flatrate' | 'ads' | 'free'> = ['flatrate', 'ads', 'free'];
          const names = (m.providers || [])
            .filter((p: any) => allowedTypes.includes(p.type))
            .map((p: { name: string; logo: string }) => this.normalizeProvider(p.name));
          if (!names.length) return false;
          // must intersect with selected
          return names.some((n: string) => selected.includes(n));
        })
      : enriched.filter(Boolean) as MovieRecommendationDto[];

    return finalList;
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


