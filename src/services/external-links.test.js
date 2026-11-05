import { describe, expect, it } from "vitest";
import {
  allowedExternalEpisode,
  allowedExternalMovie,
  allowedExternalWatch,
} from "./external-links";

describe("outbound watch URL restrictions", () => {
  it("accepts only the named NextEmbed and Variyt movie formats", () => {
    expect(allowedExternalMovie("https://api.variyt.ws/embed/movie/88585")).toBe(true);
    expect(allowedExternalMovie("https://api.nextembed.ws/embed/movie/92733")).toBe(true);
    expect(allowedExternalWatch("https://api.variyt.ws/embed/movie/88585")).toBe(true);
    expect(allowedExternalWatch("https://api.nextembed.ws/embed/tv/1399/1/2")).toBe(true);
  });
  it("keeps TV episodes limited to NextEmbed until separately verified", () => {
    expect(allowedExternalEpisode("https://api.nextembed.ws/embed/tv/1399/1/2")).toBe(true);
    expect(allowedExternalEpisode("https://api.variyt.ws/embed/tv/1399/1/2")).toBe(false);
  });
  it.each([
    "http://api.variyt.ws/embed/movie/88585",
    "https://api.variyt.ws.evil.example/embed/movie/88585",
    "https://user@api.variyt.ws/embed/movie/88585",
    "https://api.variyt.ws/embed/movie/88585?redirect=https://evil.example",
    "https://api.variyt.ws/embed/movie/88585#fragment",
    "https://api.variyt.ws:443/embed/movie/88585",
    "https://api.variyt.ws/embed/tv/88585/1/1",
    "https://api.variyt.ws/other/movie/88585",
    "https://api.variyt.ws/embed/movie/not-a-number",
    "javascript:alert(1)",
    "",
    null,
  ])("rejects unsupported or tampered URLs: %s", (url) => {
    expect(allowedExternalWatch(url)).toBe(false);
  });
});
