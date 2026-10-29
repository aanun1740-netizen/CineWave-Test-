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
import AI from "./components/AI";
import { translations } from "./translations";
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
    expect(
      within(document.querySelector(".discovery-note")).getByRole("button", {
        name: "Ask MovieLab AI",
      }),
    ).toBeTruthy();
    await user.selectOptions(screen.getByRole("combobox"), "ru");
    expect(
      within(document.querySelector(".discovery-note")).getByRole("button", {
        name: "Спросить MovieLab AI",
      }),
    ).toBeTruthy();
    await user.selectOptions(screen.getByRole("combobox"), "hy");
    expect(
      within(document.querySelector(".discovery-note")).getByRole("button", {
        name: "Հարցնել MovieLab AI-ին",
      }),
    ).toBeTruthy();
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
  it("places the AI entry after account forms without duplicate floating actions", async () => {
    history.replaceState(null, "", "#/register");
    render(<App />);
    await waitFor(() => expect(mocks.getSession).toHaveBeenCalled());
    const formSection = document.querySelector(".account-pages");
    const aiSlot = document.querySelector(".account-ai-slot");
    expect(formSection).toBeTruthy();
    expect(aiSlot?.previousElementSibling).toBe(formSection);
    expect(aiSlot?.querySelector("#cw-ai-button")).toBeTruthy();
    expect(document.querySelectorAll("#cw-ai-button")).toHaveLength(1);
    expect(document.querySelectorAll(".account-links button")).toHaveLength(4);
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
describe("MovieLab AI guest and quota messages", () => {
  const t = (key) => translations.hy[key] || key;

  it("requires an actual session before contacting the function", async () => {
    const user = userEvent.setup();
    render(<AI open={true} setOpen={vi.fn()} t={t} />);
    const field = screen.getByRole("textbox", { name: "Ձեր հաղորդագրությունը" });
    expect(field.maxLength).toBe(400);
    await user.type(field, "Բարև");
    await user.click(screen.getByRole("button", { name: "Ուղարկել հաղորդագրությունը" }));
    expect(await screen.findByText(translations.hy.aiSignIn)).toBeTruthy();
    expect(mocks.backendFetch).not.toHaveBeenCalled();
  });

  it("shows a meaningful daily quota message instead of a generic error", async () => {
    mocks.getSession.mockResolvedValue({
      data: { session: { access_token: "user-jwt-test" } },
      error: null,
    });
    mocks.backendFetch.mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: "daily_limit" }),
    });
    const user = userEvent.setup();
    render(<AI open={true} setOpen={vi.fn()} t={t} />);
    await user.type(
      screen.getByRole("textbox", { name: "Ձեր հաղորդագրությունը" }),
      "Պատմական ֆիլմ",
    );
    await user.click(screen.getByRole("button", { name: "Ուղարկել հաղորդագրությունը" }));
    expect(await screen.findByText(translations.hy.aiDailyLimit)).toBeTruthy();
    expect(mocks.backendFetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/functions\/v1\/cinewave-ai$/),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer user-jwt-test" }),
      }),
    );
  });
});

describe("React admin", () => {
  it("denies non-admin sessions without querying movie data", async () => {
    mocks.getSession.mockResolvedValue({
      data: { session: { user: { id: "u1", email: "guest@example.invalid" } } },
    });
    render(<Admin />);
    await screen.findByText(
      "Մուտքը մերժված է։ Այս հաշիվը MovieLab-ի ադմինիստրատորի իրավունքներ չունի։",
    );
    expect(
      document.querySelector(".access .brand")?.textContent.replace(/\s+/g, " ").trim(),
    ).toBe("MovieLab STUDIO");
    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText("Language / Язык / Լեզու"), "ru");
    expect(
      screen.getByText(
        "Доступ запрещён. У этого аккаунта нет прав администратора MovieLab.",
      ),
    ).toBeTruthy();
    await user.selectOptions(screen.getByLabelText("Language / Язык / Լեզու"), "en");
    expect(
      screen.getByText(
        "Access denied. This account is not an authorized MovieLab administrator.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("← Back to MovieLab")).toBeTruthy();
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
    expect(screen.getByText("MOVIELAB ԿԱՌԱՎԱՐՈՒՄ")).toBeTruthy();
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
