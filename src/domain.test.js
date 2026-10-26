import { describe, expect, it } from "vitest";
import {
  mapCatalogMovie,
  filterMovies,
  initialLanguage,
  routeFromHash,
  POSTER_FALLBACK,
  adminModel,
  approvedPlayback,
} from "./domain";
describe("migrated domain contracts", () => {
  it("uses Pages-safe fallback and Armenian default with persisted language", () => {
    expect(initialLanguage()).toBe("hy");
    localStorage.setItem("cinewave:language", "ru");
    expect(initialLanguage()).toBe("ru");
    expect(mapCatalogMovie({ id: 1 }).img).toBe(POSTER_FALLBACK);
    expect(POSTER_FALLBACK).toBe("/CineWave-Test-/assets/poster-fallback.svg");
  });
  it("combines search, genres, content type and saved list", () => {
    const rows = [
      mapCatalogMovie({ id: 1, title_en: "Solar", genre_names: ["Drama"] }),
      mapCatalogMovie({
        id: 2,
        title_hy: "Լուսին",
        genre_names: ["Comedy"],
        media_type: "tv",
      }),
    ];
    expect(
      filterMovies(rows, { query: "Լուսին", genre: "Comedy", route: "tv" }).map(
        (row) => row.id,
      ),
    ).toEqual(["catalog:2"]);
    expect(
      filterMovies(rows, { route: "my-list", list: new Set(["catalog:1"]) })
        .length,
    ).toBe(1);
  });
  it.each(["mp4", "webm", "m3u8"])(
    "accepts %s only with matching playback evidence",
    (extension) => {
      const url = `https://media.invalid/film.${extension}`;
      expect(adminModel.media(url)).toBe(true);
      const movie = {
        video: url,
        approval: {
          watch_url: url,
          license_verified: true,
          playback_verified: true,
          commercial_reuse_verified: true,
          license_source: "https://rights.invalid/proof",
          license_terms_source: "https://rights.invalid/terms",
        },
      };
      expect(approvedPlayback(movie)).toBe(true);
      movie.approval.playback_verified = false;
      expect(approvedPlayback(movie)).toBe(false);
    },
  );
  it("preserves hash routes, recovery tokens and invalid-route fallback", () => {
    expect(routeFromHash("#/watch/catalog%3A1")).toBe("watch/catalog%3A1");
    expect(routeFromHash("#access_token=fixture")).toBe("home");
    expect(routeFromHash("#/unknown")).toBe("home");
  });
});
