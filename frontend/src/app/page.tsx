"use client";
import { useState } from "react";

type Movie = {
  title: string;
  year?: string;
  reason?: string;
  imdbId?: string;
  poster?: string;
  rating?: string;
  trailerUrl?: string;
  watchLink?: string;
  providers?: { name: string; logo: string; type?: 'flatrate' | 'rent' | 'buy' | 'free' | 'ads' }[];
};

const KNOWN_PLATFORMS = [
  "Netflix",
  "Amazon Prime Video",
  "Disney Plus",
  "HBO Max",
  "Paramount Plus",
  "Apple TV Plus",
] as const;

const PLATFORM_META: Record<(typeof KNOWN_PLATFORMS)[number], { label: string; svg: string; color: string }> = {
  Netflix: { label: 'Netflix', svg: '/icons/netflix.svg', color: '#e50914' },
  'Amazon Prime Video': { label: 'Prime Video', svg: '/icons/primevideo.svg', color: '#00a8e1' },
  'Disney Plus': { label: 'Disney Plus', svg: '/icons/disneyplus.svg', color: '#0a84ff' },
  'HBO Max': { label: 'HBO Max', svg: '/icons/hbomax.svg', color: '#6d5dfc' },
  'Paramount Plus': { label: 'Paramount Plus', svg: '/icons/paramountplus.svg', color: '#0064ff' },
  'Apple TV Plus': { label: 'Apple TV Plus', svg: '/icons/appletvplus.svg', color: '#9aa0a6' },
};

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState<number>(5);
  const [region, setRegion] = useState<string>("AR");
  const [loading, setLoading] = useState(false);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState<Record<number, boolean>>({});
  const [platformsAll, setPlatformsAll] = useState<boolean>(true);
  const [platforms, setPlatforms] = useState<string[]>([]);

  const normalizeProvider = (name: string) => {
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

  function getYouTubeId(url?: string): string | null {
    if (!url) return null;
    const m = url.match(/(?:embed\/|watch\?v=)([A-Za-z0-9_-]{6,})/);
    return m ? m[1] : null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMovies([]);
    try {
      const res = await fetch("http://localhost:3001/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt || undefined,
          count,
          region,
          platforms: platformsAll ? undefined : platforms,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Error del servidor");
      const incoming: Movie[] = Array.isArray(data?.movies) ? data.movies : [];
      // Frontend safety filter by platforms to avoid falsos positivos
      const selected = platformsAll ? [] : platforms.map((p) => normalizeProvider(p));
      const allowedTypes: ReadonlyArray<'flatrate' | 'free' | 'ads'> = ['flatrate', 'free', 'ads'] as const;
      const filtered = selected.length
        ? incoming.filter((m) => {
            const names = (m.providers || [])
              .filter((p) => !p.type || (p.type === 'flatrate' || p.type === 'free' || p.type === 'ads'))
              .map((p) => normalizeProvider(p.name));
            return names.length > 0 && names.some((n) => selected.includes(n));
          })
        : incoming;
      setMovies(filtered);
    } catch (err: any) {
      setError(err?.message ?? "Error al obtener recomendaciones");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <header className="header">
        <h1>MoviesExpress</h1>
        <p>
          Describe lo que querés ver y elegí cuántas sugerencias. Cuanto más contexto
          mejor: podés sumar géneros, actores/actrices, directores, rango de años o
          calificaciones que te interesen para que las recomendaciones sean más precisas.
        </p>
      </header>

      <form onSubmit={onSubmit} className="card form">
        <label className="field">
          <span className="label">Descripción</span>
          <textarea
            className="input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
          />
        </label>
        <label className="field small">
          <span className="label">Cantidad (1-15)</span>
          <input
            className="input"
            type="number"
            min={1}
            max={15}
            value={count}
            onChange={(e) => {
              const val = Math.max(1, Math.min(15, Number(e.target.value || 0)));
              setCount(val);
            }}
          />
        </label>
        <label className="field small">
          <span className="label">País</span>
          <select className="input" value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="AR">Argentina</option>
            <option value="US">Estados Unidos</option>
            <option value="ES">España</option>
            <option value="MX">México</option>
            <option value="BR">Brasil</option>
            <option value="CL">Chile</option>
            <option value="CO">Colombia</option>
          </select>
        </label>
        <fieldset className="field platformsBlock" style={{ gridColumn: "1 / -1" }}>
          <span className="label platformsTitle">Plataformas</span>
          <div className={`chips elevated ${platformsAll && platforms.length === 0 ? '' : 'active'}`}>
            <label className={`chip ${platformsAll ? "chipSelected" : ""}`}>
              <input
                type="checkbox"
                checked={platformsAll}
                onChange={(e) => {
                  setPlatformsAll(e.target.checked);
                  if (e.target.checked) setPlatforms([]);
                }}
              />
              <span className="chipIcon" style={{ backgroundColor: '#6d5dfc' }}>★</span>
              <span className="chipText">Todas</span>
            </label>
            {KNOWN_PLATFORMS.map((p) => (
              <label key={p} className={`chip ${!platformsAll && platforms.includes(p) ? "chipSelected" : ""}`}>
                <input
                  type="checkbox"
                  checked={!platformsAll && platforms.includes(p)}
                  onChange={(e) => {
                    // Si estaba en "Todas", al tildar una plataforma pasamos a modo selectivo
                    if (platformsAll) {
                      setPlatformsAll(false);
                      if (e.target.checked) {
                        setPlatforms([p]);
                        return;
                      }
                    }
                    setPlatforms((prev) =>
                      e.target.checked ? [...prev, p] : prev.filter((x) => x !== p)
                    );
                  }}
                />
                <span className="chipIcon" style={{ backgroundColor: PLATFORM_META[p].color }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={PLATFORM_META[p].svg} alt="" width={14} height={14} />
                </span>
                <span className="chipText">{PLATFORM_META[p].label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <button type="submit" className="button" disabled={loading || !prompt.trim()}>
          {loading ? "Buscando..." : "Recomendar"}
        </button>
        {error && <p className="error">{error}</p>}
      </form>

      <section className="grid">
        {movies.map((m, idx) => (
          <details className="card movie" key={`${m.title}-${idx}`}>
            <summary style={{ listStyle: "none", display: "contents" }}>
              {m.poster ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="poster" src={m.poster} alt={m.title} />
              ) : (
                <div className="poster placeholder" />
              )}
              <div className="content">
                <h3 className="title">
                  {m.title} {m.year ? `(${m.year})` : null}
                </h3>
                {m.rating && <div className="rating">Rating: {m.rating}</div>}
                {m.reason && <p className="reason">{m.reason}</p>}
                <div className="hint">Clic para ver más</div>
              </div>
            </summary>
            <div className="providers">
              <span className="providersLabel">Dónde ver:</span>
              {m.providers?.map((p) => (
                <img key={p.name} className="providerLogo" src={p.logo} alt={p.name} title={p.name} />
              ))}
              {m.watchLink && (
                <a className="watchLink" href={m.watchLink} target="_blank" rel="noreferrer">Ver opciones</a>
              )}
            </div>
            {m.trailerUrl ? (
              <div className="trailer">
                {playing[idx] ? (
                  <iframe
                    className="video"
                    src={m.trailerUrl.includes('autoplay=1') ? m.trailerUrl : `${m.trailerUrl}?autoplay=1`}
                    title={`Trailer de ${m.title}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  (() => {
                    const id = getYouTubeId(m.trailerUrl);
                    const thumb = id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : undefined;
                    return (
                      <button className="videoThumb" type="button" onClick={() => setPlaying({ ...playing, [idx]: true })}>
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb} alt={`Trailer de ${m.title}`} style={{ width: '100%', display: 'block' }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", background: "#222", borderRadius: 8 }} />
                        )}
                        <span className="playOverlay" aria-hidden />
                      </button>
                    );
                  })()
                )}
              </div>
            ) : (
              <div className="trailer">
                <a
                  className="button"
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${m.title} ${m.year || ""} trailer oficial`)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: "none", display: "inline-block" }}
                >
                  Buscar tráiler en YouTube
                </a>
              </div>
            )}
          </details>
        ))}
      </section>
    </div>
  );
}
