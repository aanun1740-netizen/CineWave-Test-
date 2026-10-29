import { useEffect, useRef } from "react";
import { localizedMovie, genreLabel, adminModel } from "../domain";
import Player from "./Player";
import { Artwork } from "./MovieRow";
export default function MovieDialog({
  movie,
  loading,
  watch,
  language,
  t,
  close,
  onWatch,
  toggle,
  saved,
  watchable,
  onProgress,
}) {
  const dialog = useRef(null),
    closer = useRef(null);
  useEffect(() => {
    const opener = document.activeElement;
    document.body.classList.add("has-player-dialog");
    closer.current?.focus();
    return () => {
      document.body.classList.remove("has-player-dialog");
      if (opener?.isConnected) opener.focus();
    };
  }, []);
  const info = movie ? localizedMovie(movie, language) : {};
  return (
    <div
      className="modal open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modalTitle"
      ref={dialog}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          close();
        }
        if (e.key === "Tab") {
          const nodes = [
            ...dialog.current.querySelectorAll(
              'button:not(:disabled),a[href],input:not(:disabled),select,[tabindex="0"]',
            ),
          ].filter((node) => node.getClientRects().length);
          const first = nodes[0],
            last = nodes.at(-1);
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }}
    >
      <div className="dialog">
        <div className="dialog-top">
          <div>
            <span className="eyebrow">MOVIELAB</span>
            <h2 id="modalTitle">
              {info.title || t(loading ? "loading" : "titleUnknown")}
            </h2>
          </div>
          <button
            className="close"
            ref={closer}
            onClick={close}
            aria-label={t("close")}
          >
            ×
          </button>
        </div>
        <div className="video-wrap">
          {movie &&
            (watch && watchable(movie) ? (
              <Player
                movie={movie}
                language={language}
                onProgress={onProgress}
              />
            ) : (
              <div className="details-art">
                <Artwork
                  className="detail-poster"
                  src={movie.img}
                  alt={info.title}
                />
                {!watchable(movie) && (
                  <div className="availability-note">{t("browseOnly")}</div>
                )}
              </div>
            ))}
        </div>
        <div className="dialog-info">
          <div className="meta">
            {movie &&
              [movie.year, ...movie.genres.map((g) => genreLabel(g, language))]
                .filter(Boolean)
                .map((value, i) => <span key={i}>{value}</span>)}
          </div>
          <p>
            {info.desc ||
              t(movie ? "descriptionFallback" : loading ? "loading" : "empty")}
          </p>
          {movie && (
            <div className="detail-actions">
              {!watch && watchable(movie) && (
                <button className="btn primary" onClick={onWatch}>
                  {t("watch")}
                </button>
              )}
              <button
                className="btn secondary"
                aria-pressed={saved}
                onClick={() => toggle(movie)}
              >
                {saved ? "✓ " : "＋ "}
                {t(saved ? "inList" : "list")}
              </button>
              {adminModel.https(movie.trailer) && (
                <a
                  className="btn secondary"
                  href={movie.trailer}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {
                    {
                      hy: "Դիտել թրեյլերը",
                      ru: "Трейлер",
                      en: "Watch trailer",
                    }[language]
                  }
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
