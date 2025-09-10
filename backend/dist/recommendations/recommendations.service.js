"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationsService = void 0;
const common_1 = require("@nestjs/common");
const openai_1 = __importDefault(require("openai"));
const cross_fetch_1 = __importDefault(require("cross-fetch"));
let RecommendationsService = class RecommendationsService {
    openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
    omdbApiKey = process.env.OMDB_API_KEY;
    tmdbApiKey = process.env.TMDB_API_KEY;
    youtubeApiKey = process.env.YOUTUBE_API_KEY;
<<<<<<< HEAD
    normalizeProvider = (name) => {
        const slug = (name || '')
            .toLowerCase()
            .replace(/\+/g, 'plus')
            .replace(/[^a-z0-9]/g, '');
        const aliases = {
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
=======
>>>>>>> 0111ec8a9e3c8467df8a07c3768e8eb147391359
    async getRecommendations(filters) {
        const count = Math.max(1, Math.min(50, filters.count ?? 5));
        const systemPrompt = 'Eres un asistente que recomienda películas. Devuelve un JSON con este formato exacto: {"movies":[{"title":"","year":"","reason":""}]} sin texto adicional.';
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
        let movies;
        try {
            const parsed = JSON.parse(messageContent);
            movies = Array.isArray(parsed.movies) ? parsed.movies : [];
        }
        catch {
            movies = [];
        }
<<<<<<< HEAD
        const selected = Array.isArray(filters?.platforms)
            ? filters.platforms.map((s) => this.normalizeProvider(s))
            : [];
=======
>>>>>>> 0111ec8a9e3c8467df8a07c3768e8eb147391359
        const enriched = await Promise.all(movies.slice(0, count).map(async (m) => {
            let base = { title: m.title, year: m.year, reason: m.reason };
            if (this.omdbApiKey) {
                try {
                    const url = `https://www.omdbapi.com/?apikey=${this.omdbApiKey}&t=${encodeURIComponent(m.title)}`;
                    const res = await (0, cross_fetch_1.default)(url);
                    const data = (await res.json());
                    if (data && data.Response !== 'False') {
                        base = {
                            title: data.Title ?? base.title,
                            year: data.Year ?? base.year,
                            reason: base.reason,
                            imdbId: data.imdbID,
<<<<<<< HEAD
                            poster: data.Poster && data.Poster !== 'N/A' ? data.Poster : base.poster,
                            rating: Array.isArray(data.Ratings) && data.Ratings.length > 0
                                ? data.Ratings[0].Value
                                : base.rating,
=======
                            poster: data.Poster && data.Poster !== 'N/A' ? data.Poster : undefined,
                            rating: Array.isArray(data.Ratings) && data.Ratings.length > 0
                                ? data.Ratings[0].Value
                                : undefined,
>>>>>>> 0111ec8a9e3c8467df8a07c3768e8eb147391359
                        };
                    }
                }
                catch { }
            }
<<<<<<< HEAD
            if (this.tmdbApiKey) {
                try {
                    const region = filters?.region?.toUpperCase?.() || (process.env.TMDB_REGION || 'AR').toUpperCase();
                    const movieSearch = `https://api.themoviedb.org/3/search/movie?api_key=${this.tmdbApiKey}&query=${encodeURIComponent(m.title)}${m.year ? `&year=${encodeURIComponent(m.year)}` : ''}&include_adult=false&language=es-ES`;
                    let res = await (0, cross_fetch_1.default)(movieSearch);
                    let data = (await res.json());
                    let first = Array.isArray(data?.results) && data.results.length > 0 ? data.results[0] : null;
                    let media = first ? 'movie' : null;
                    if (!first) {
                        const tvSearch = `https://api.themoviedb.org/3/search/tv?api_key=${this.tmdbApiKey}&query=${encodeURIComponent(m.title)}&include_adult=false&language=es-ES`;
                        res = await (0, cross_fetch_1.default)(tvSearch);
                        data = (await res.json());
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
                        try {
                            const videosUrl = `https://api.themoviedb.org/3/${media === 'tv' ? 'tv' : 'movie'}/${first.id}/videos?api_key=${this.tmdbApiKey}&language=es-ES`;
                            const vres = await (0, cross_fetch_1.default)(videosUrl);
                            const vdata = (await vres.json());
                            const yt = (vdata?.results || []).find((v) => v.site === 'YouTube' && v.type === 'Trailer' && v.key) || (vdata?.results || []).find((v) => v.site === 'YouTube' && v.key);
                            if (yt?.key)
                                base.trailerUrl = `https://www.youtube.com/embed/${yt.key}`;
                        }
                        catch { }
                        try {
                            const provUrl = `https://api.themoviedb.org/3/${media === 'tv' ? 'tv' : 'movie'}/${first.id}/watch/providers?api_key=${this.tmdbApiKey}`;
                            const pres = await (0, cross_fetch_1.default)(provUrl);
                            const pdata = (await pres.json());
                            const entry = pdata?.results?.[region] || pdata?.results?.US || pdata?.results?.AR;
                            if (entry) {
                                base.watchLink = entry.link;
                                const pack = [];
                                const seen = new Set();
                                const take = (arr, type) => Array.isArray(arr)
                                    ? arr.slice(0, 8).forEach((p) => {
                                        if (p?.provider_name && p?.logo_path && !seen.has(p.provider_name)) {
                                            seen.add(p.provider_name);
                                            pack.push({ name: p.provider_name, logo: `https://image.tmdb.org/t/p/w92${p.logo_path}`, type: type ?? 'flatrate' });
                                        }
                                    })
                                    : undefined;
                                take(entry.flatrate, 'flatrate');
                                if (pack.length < 8)
                                    take(entry.free, 'free');
                                if (pack.length < 8)
                                    take(entry.ads, 'ads');
                                if (pack.length < 8)
                                    take(entry.rent, 'rent');
                                if (pack.length < 8)
                                    take(entry.buy, 'buy');
                                base.providers = pack.length ? pack : undefined;
=======
            if ((!base.poster || base.poster === 'N/A') && this.tmdbApiKey) {
                try {
                    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${this.tmdbApiKey}&query=${encodeURIComponent(m.title)}${m.year ? `&year=${encodeURIComponent(m.year)}` : ''}&include_adult=false&language=es-ES`;
                    const res = await (0, cross_fetch_1.default)(searchUrl);
                    const tmdb = (await res.json());
                    const first = Array.isArray(tmdb?.results) && tmdb.results.length > 0 ? tmdb.results[0] : null;
                    if (first && first.poster_path) {
                        base.poster = `https://image.tmdb.org/t/p/w342${first.poster_path}`;
                    }
                    if (!base.rating && typeof first?.vote_average === 'number') {
                        base.rating = String(first.vote_average);
                    }
                    if (first?.id) {
                        try {
                            const videosUrl = `https://api.themoviedb.org/3/movie/${first.id}/videos?api_key=${this.tmdbApiKey}&language=es-ES`;
                            const vres = await (0, cross_fetch_1.default)(videosUrl);
                            const vdata = (await vres.json());
                            const yt = (vdata?.results || []).find((v) => v.site === 'YouTube' && v.type === 'Trailer' && v.key) || (vdata?.results || []).find((v) => v.site === 'YouTube' && v.key);
                            if (yt?.key) {
                                base.trailerUrl = `https://www.youtube.com/embed/${yt.key}`;
>>>>>>> 0111ec8a9e3c8467df8a07c3768e8eb147391359
                            }
                        }
                        catch { }
                    }
                }
                catch { }
            }
            if (!base.trailerUrl && this.youtubeApiKey) {
                try {
                    const query = `${m.title} ${m.year ? ` ${m.year}` : ''} trailer oficial`;
                    const yurl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=1&q=${encodeURIComponent(query)}&key=${this.youtubeApiKey}`;
                    const yres = await (0, cross_fetch_1.default)(yurl);
                    const ydata = (await yres.json());
                    const id = ydata?.items?.[0]?.id?.videoId;
<<<<<<< HEAD
                    if (id)
                        base.trailerUrl = `https://www.youtube.com/embed/${id}`;
                }
                catch { }
            }
            if (selected.length) {
                const allowedTypes = ['flatrate', 'ads', 'free'];
                const names = (base.providers || [])
                    .filter((p) => allowedTypes.includes(p.type))
                    .map((p) => this.normalizeProvider(p.name));
                const ok = names.some((n) => selected.includes(n));
                if (!ok)
                    return null;
            }
            return base;
        }));
        const finalList = selected.length
            ? enriched.filter((m) => {
                if (!m)
                    return false;
                const allowedTypes = ['flatrate', 'ads', 'free'];
                const names = (m.providers || [])
                    .filter((p) => allowedTypes.includes(p.type))
                    .map((p) => this.normalizeProvider(p.name));
                if (!names.length)
                    return false;
                return names.some((n) => selected.includes(n));
            })
            : enriched.filter(Boolean);
        return finalList;
=======
                    if (id) {
                        base.trailerUrl = `https://www.youtube.com/embed/${id}`;
                    }
                }
                catch { }
            }
            return base;
        }));
        return enriched;
>>>>>>> 0111ec8a9e3c8467df8a07c3768e8eb147391359
    }
    buildUserPrompt(filters, count) {
        const parts = [];
        if (filters.prompt)
            parts.push(`Preferencias: ${filters.prompt}`);
        if (filters.genres?.length)
            parts.push(`Géneros: ${filters.genres.join(', ')}`);
        if (filters.actors?.length)
            parts.push(`Actores: ${filters.actors.join(', ')}`);
        if (filters.directors?.length)
            parts.push(`Directores: ${filters.directors.join(', ')}`);
        if (filters.minYear || filters.maxYear)
            parts.push(`Años: ${filters.minYear ?? ''}-${filters.maxYear ?? ''}`);
        if (filters.minRating)
            parts.push(`Rating mínimo: ${filters.minRating}`);
        parts.push(`Cantidad: ${count}`);
        return `Recomienda exactamente ${count} películas según estas condiciones. Responde solo con JSON:
${parts.join('\n')}`;
    }
};
exports.RecommendationsService = RecommendationsService;
exports.RecommendationsService = RecommendationsService = __decorate([
    (0, common_1.Injectable)()
], RecommendationsService);
//# sourceMappingURL=recommendations.service.js.map