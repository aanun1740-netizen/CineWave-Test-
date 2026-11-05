// Explicitly permitted outbound destinations for the KinoLab staging catalog.
// These links open in a separate tab; neither host is treated as a trusted iframe or stream.
const nextEmbedMovie = /^https:\/\/api\.nextembed\.ws\/embed\/movie\/\d+\/?$/;
const nextEmbedEpisode = /^https:\/\/api\.nextembed\.ws\/embed\/tv\/\d+\/[1-9]\d*\/[1-9]\d*\/?$/;
const nextEmbedLegacy = /^https:\/\/api\.nextembed\.ws\/embed\/(?:movie|tv)\/\d+(?:\/\d+\/\d+)?\/?$/;
const variytMovie = /^https:\/\/api\.variyt\.ws\/embed\/movie\/\d+\/?$/;

export const allowedExternalMovie = (url) =>
  typeof url === "string" && (nextEmbedMovie.test(url) || variytMovie.test(url));

export const allowedExternalEpisode = (url) =>
  typeof url === "string" && nextEmbedEpisode.test(url);

export const allowedExternalWatch = (url) =>
  typeof url === "string" && (nextEmbedLegacy.test(url) || variytMovie.test(url));
