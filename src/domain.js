import "../catalog.js";
import "../availability.js";
import "../model.js";
export const POSTER_FALLBACK = `${import.meta.env.BASE_URL}assets/poster-fallback.svg`;
const catalog = window.CineWaveCatalog;
export const { localizedMovie, genreLabel, availableGenres, canonicalGenre } =
  catalog;
export const mapCatalogMovie = (row) => {
  const movie = catalog.mapCatalogMovie(row);
  return {
    ...movie,
    img:
      movie.img === "assets/poster-fallback.svg" ? POSTER_FALLBACK : movie.img,
  };
};
export const { approvedPlayback } = window.CineWaveAvailability;
export const adminModel = window.CineWaveAdminModel;
export function filterMovies(
  movies,
  {
    query = "",
    genre = "All",
    route = "home",
    list = new Set(),
    language = "hy",
  } = {},
) {
  const q = query.trim().toLocaleLowerCase();
  return movies.filter(
    (movie) =>
      (genre === "All" || movie.genres.includes(genre)) &&
      (!q ||
        [
          ...Object.values(movie.titles),
          ...movie.genres.flatMap((g) => [g, genreLabel(g, language)]),
        ].some((text) => String(text).toLocaleLowerCase().includes(q))) &&
      (route !== "my-list" || list.has(movie.id)) &&
      (route !== "movies" || movie.kind === "Movie") &&
      (route !== "tv" || movie.kind === "TV Show"),
  );
}
export function readStored(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
export function writeStored(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
export function initialLanguage() {
  try {
    const value = localStorage.getItem("cinewave:language");
    return ["hy", "ru", "en"].includes(value) ? value : "hy";
  } catch {
    return "hy";
  }
}
export function routeFromHash(hash = location.hash) {
  if (/^#(?:access_token|refresh_token|error)=/.test(hash)) return "home";
  const route = hash.replace(/^#\/?/, "") || "home";
  return /^(home|movies|tv|my-list|login|register|profile|forgot|recover|movie\/.+|watch\/.+)$/.test(
    route,
  )
    ? route
    : "home";
}
