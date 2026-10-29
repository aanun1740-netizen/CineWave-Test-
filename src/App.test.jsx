import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
const mocks = vi.hoisted(() => ({
  backendFetch: vi.fn(),
  getSession: vi.fn(),
  signIn: vi.fn(),
  role: vi.fn(),
  from: vi.fn(),
  signOut: vi.fn(),
  authCallback: null,
}));
vi.mock("./services/backend", () => ({
  base: "/CineWave-Test-/",
  config: { url: "https://zayssiouqexwdicudalc.supabase.co", key: "fixture" },
  backendFetch: mocks.backendFetch,
  signOut: mocks.signOut,
  client: {
    auth: {
      getSession: mocks.getSession,
      onAuthStateChange: (callback) => {
        mocks.authCallback = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
      signInWithPassword: mocks.signIn,
    },
    rpc: mocks.role,
    from: mocks.from,
  },
}));
import App from "./App";
import Admin from "./Admin";
const proof = (url) => ({
  watch_url: url,
  license_verified: true,
  playback_verified: true,
  commercial_reuse_verified: true,
  license_source: "https://rights.invalid/evidence",
  license_terms_source: "https://rights.invalid/terms",
});
const films = [
  {
    id: "1",
    title_en: "Solar Story",
    title_hy: "Արևի պատմություն",
    title_ru: "Солнечная история",
    release_date: "2024-01-01",
    genre_names: ["Drama"],
    watch_url: "https://media.invalid/film.webm",
    playback_verification: proof("https://media.invalid/film.webm"),
  },
  {
    id: "2",
    title_en: "Moon Show",
    title_hy: "Լուսնի սերիալ",
    release_date: "2023-01-01",
    media_type: "tv",
    genre_names: ["Comedy"],
  },
];
beforeEach(() => {
  vi.clearAllMocks();
  mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
  mocks.backendFetch.mockResolvedValue({ ok: true, json: async () => films });
  mocks.role.mockResolvedValue({ data: false, error: null });
  mocks.signOut.mockResolvedValue({ failed: false });
  globalThis.fetch = vi
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({ films: [] }) });
});
describe("React storefront", () => {
  it("defaults to Armenian, searches multilingual titles, filters TV and changes language", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findAllByText("Արևի պատմություն");
    expect(document.documentElement.lang).toBe("hy");
    await user.type(screen.getByRole("searchbox"), "Солнечная");
    expect(screen.queryByText("Լուսնի սերիալ")).toBeNull();
    expect(
      within(document.querySelector("#catalogSection")).getByText(
        "Արևի պատմություն",
      ),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Մաքրել որոնումը" }));
    await user.click(
      within(
        screen.getByRole("navigation", { name: "Գլխավոր նավարկում" }),
      ).getByText("Սերիալներ"),
    );
    expect(screen.getByText("Լուսնի սերիալ")).toBeTruthy();
    expect(
      within(document.querySelector("#catalogSection")).queryByText(
        "Արևի պատմություն",
      ),
    ).toBeNull();
    await user.selectOptions(screen.getByRole("combobox"), "en");
    expect(document.documentElement.lang).toBe("en");
    expect(screen.getByRole("searchbox").placeholder).toBe("Search titles...");
  });
  it("saves guest My List and opens/reloads hash movie routes", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findAllByText("Արևի պատմություն");
    await waitFor(() => expect(mocks.getSession).toHaveBeenCalled());
    const hero = document.querySelector(".hero");
    await user.click(within(hero).getByRole("button", { name: "Իմ ցանկը" }));
    expect(JSON.parse(localStorage.getItem("cinewave:my-list"))).toEqual([
      "catalog:1",
    ]);
    await user.click(
      within(
        screen.getByRole("navigation", { name: "Գլխավոր նավարկում" }),
      ).getByText("Իմ ցանկը"),
    );
    expect(screen.queryByText("Լուսնի սերիալ")).toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Արևի պատմություն — Դիտել հիմա" }),
    );
    const dialog = screen.getByRole("dialog", { name: "Արևի պատմություն" });
    expect(location.hash).toContain("movie/");
    await user.click(within(dialog).getByRole("button", { name: "Փակել" }));
    expect(location.hash).toBe("#/my-list");
  });
  it("renders recoverable catalog errors and retries safely", async () => {
    mocks.backendFetch.mockRejectedValueOnce(Error("offline"));
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Չհաջողվեց բեռնել հավաքածուն։ Փորձեք կրկին։");
    await user.click(screen.getByRole("button", { name: "Փորձել կրկին" }));
    await screen.findAllByText("Արևի պատմություն");
    expect(mocks.backendFetch).toHaveBeenCalledTimes(2);
  });
  it("preserves WebM playback, progress and Continue Watching", async () => {
    localStorage.setItem(
      "cinewave:playback:catalog:1",
      JSON.stringify({ time: 30, duration: 100 }),
    );
    history.replaceState(null, "", "#/watch/catalog%3A1");
    render(<App />);
    const dialog = await screen.findByRole("dialog", {
      name: "Արևի պատմություն",
    });
    await waitFor(() =>
      expect(dialog.querySelector("video")?.src).toBe(
        "https://media.invalid/film.webm",
      ),
    );
    expect(screen.getByText("Շարունակել դիտումը")).toBeTruthy();
  });
  it("restores a signed-in member's saved language after reload", async () => {
    localStorage.setItem("cinewave:language", "en");
    document.documentElement.lang = "en";
    const session = {
      user: { id: "member-1", email: "member@example.invalid" },
    };
    mocks.getSession.mockResolvedValue({ data: { session }, error: null });
    const profileQuery = {
      select: vi.fn(() => profileQuery),
      eq: vi.fn(() => profileQuery),
      maybeSingle: vi.fn(async () => ({
        data: { display_name: "Test User", preferred_language: "hy" },
        error: null,
      })),
    };
    const listQuery = {
      select: vi.fn(() => listQuery),
      eq: vi.fn(async () => ({ data: [], error: null })),
    };
    mocks.from.mockImplementation((table) =>
      table === "profiles" ? profileQuery : listQuery,
    );
    render(<App />);
    await waitFor(() =>
      expect(localStorage.getItem("cinewave:language")).toBe("hy"),
    );
    expect(document.documentElement.lang).toBe("hy");
    expect(screen.getByRole("searchbox").placeholder).toBe("Որոնել ֆիլմ...");
  });
  it("submits sign-in through existing Supabase auth and handles failure", async () => {
    mocks.signIn.mockResolvedValue({ error: Error("bad credentials") });
    history.replaceState(null, "", "#/login");
    const user = userEvent.setup();
    render(<App />);
    await user.type(
      screen.getByLabelText("Էլեկտրոնային հասցե"),
      "guest@example.invalid",
    );
    await user.type(screen.getByLabelText("Գաղտնաբառ"), "wrong-password");
    await user.click(
      within(document.querySelector(".account-form")).getByRole("button", {
        name: "Մուտք գործել",
        exact: true,
      }),
    );
    await screen.findByText(
      "Չհաջողվեց ավարտել գործողությունը։ Ստուգեք կապը և փորձեք կրկին։",
    );
    expect(mocks.signIn).toHaveBeenCalledWith({
      email: "guest@example.invalid",
      password: "wrong-password",
    });
    expect(screen.getByLabelText("Գաղտնաբառ").value).toBe("");
  });
});
describe("React admin", () => {
  it("denies non-admin sessions without querying movie data", async () => {
    mocks.getSession.mockResolvedValue({
      data: { session: { user: { id: "u1", email: "guest@example.invalid" } } },
    });
    render(<Admin />);
    await screen.findByText(
      "Մուտքը մերժված է։ Այս հաշիվը CineWave-ի ադմինիստրատորի իրավունքներ չունի։",
    );
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("loads authorized library, validates editor and confirms deletion without a write", async () => {
    mocks.getSession.mockResolvedValue({
      data: { session: { user: { id: "u1", email: "admin@example.invalid" } } },
    });
    mocks.role.mockResolvedValue({ data: true });
    const chain = {
      select: vi.fn(() => chain),
      order: vi.fn(() => chain),
      range: vi.fn(async () => ({
        data: [
          {
            ...films[0],
            is_published: false,
            rights_verification_status: "unverified",
            updated_at: "fixture",
          },
        ],
      })),
    };
    mocks.from.mockReturnValue(chain);
    const user = userEvent.setup();
    render(<Admin />);
    await screen.findByText("Solar Story");
    await user.click(screen.getByRole("button", { name: "▤ Ֆիլմադարան" }));
    await user.click(screen.getByRole("button", { name: "Ջնջել" }));
    expect(screen.getByRole("button", { name: "Հաստատել" }).disabled).toBe(
      true,
    );
    await user.click(screen.getByRole("button", { name: "Չեղարկել" }));
    expect(chain.range).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Խմբագրել" }));
    expect(screen.getByDisplayValue("Solar Story")).toBeTruthy();
    expect(screen.getByText("Հիմնական MP4, WebM կամ HLS URL")).toBeTruthy();
  });
});
