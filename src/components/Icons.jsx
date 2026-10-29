export function Icon({ name }) {
  return (
    <svg aria-hidden="true">
      <use href={`#i-${name}`} />
    </svg>
  );
}
export function Icons() {
  return (
    <svg
      className="icon-defs"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <symbol id="i-play" viewBox="0 0 24 24">
          <path d="m9 5 11 7-11 7z" fill="currentColor" stroke="none" />
        </symbol>
        <symbol id="i-search" viewBox="0 0 24 24">
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m16 16 5 5" />
        </symbol>
        <symbol id="i-user" viewBox="0 0 24 24">
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 21v-3a7 7 0 0 1 14 0v3" />
        </symbol>
        <symbol id="i-heart" viewBox="0 0 24 24">
          <path d="M20 5c-3-3-6-1-8 1C5-2-4 9 12 21 22 14 24 9 20 5Z" />
        </symbol>
        <symbol id="i-info" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v6m0-10v1" />
        </symbol>
      </defs>
    </svg>
  );
}


export function Brand({ href = "#/home" }) {
  return (
    <a className="brand" href={href} aria-label="MovieLab Home">
      <img
        src={`${import.meta.env.BASE_URL}assets/movielab-house-clapper-logo.svg`}
        alt="MovieLab"
        style={{
          width: "92px",
          maxWidth: "100%",
          height: "72px",
          objectFit: "contain",
          objectPosition: "left center",
          filter: "invert(1)",
          display: "block",
        }}
      />
    </a>
  );
}

