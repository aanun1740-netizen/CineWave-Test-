import { test, expect } from "@playwright/test";
const fixture = [
  {
    id: "1",
    title_en: "Solar Story",
    title_hy: "Արևի պատմություն",
    title_ru: "Солнечная история",
    release_date: "2024-01-01",
    genre_names: ["Drama"],
    poster_path: null,
  },
  {
    id: "2",
    title_en: "Moon Show",
    title_hy: "Լուսնի սերիալ",
    release_date: "2023-01-01",
    genre_names: ["Comedy"],
    media_type: "tv",
  },
];
test.beforeEach(async ({ page }) => {
  // All remote traffic is fulfilled locally or aborted. No real Supabase requests.
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin === "http://127.0.0.1:4173") return route.continue();
    if (
      url.origin === "https://zayssiouqexwdicudalc.supabase.co" &&
      url.pathname === "/rest/v1/movies" &&
      route.request().method() === "GET"
    )
      return route.fulfill({ json: fixture });
    return route.abort();
  });
});
test("Pages build: Armenian, catalog, responsive layout, list, routes and languages", async ({
  page,
}, info) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./");
  await expect(page.locator("html")).toHaveAttribute("lang", "hy");
  await expect(page.locator("#heroTitle")).toHaveText("Արևի պատմություն");
  await expect(page.locator(".poster img").first()).toHaveJSProperty(
    "naturalWidth",
    500,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("storefront.png"),
    fullPage: true,
  });
  await page
    .locator(".hero")
    .getByRole("button", { name: "Իմ ցանկը", exact: true })
    .click();
  const navigation = page.locator(
    info.project.name === "mobile" ? ".mobile-nav" : ".nav",
  );
  await navigation
    .getByRole("button", { name: "Իմ ցանկը", exact: true })
    .click();
  await expect(page.locator("#catalogSection .movie")).toHaveCount(1);
  await page.locator("#catalogSection .movie").click();
  await expect(
    page.getByRole("dialog", { name: "Արևի պատմություն" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("dialog", { name: "Արևի պատմություն" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Փակել", exact: true }).click();
  await page.getByRole("searchbox").fill("Солнечная");
  await expect(page.locator("#catalogSection .movie")).toHaveCount(1);
  await page.locator("#language").selectOption("ru");
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await page.locator("#language").selectOption("en");
  await expect(page.getByRole("searchbox")).toHaveAttribute(
    "placeholder",
    "Search titles...",
  );
  expect(errors).toEqual([]);
});
test("admin entry survives reload under the Pages prefix and shows safe login", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("admin/");
  await expect(
    page.getByRole("heading", { name: "Ձեր կինոն։ Ձեր կառավարման կենտրոնը։" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Մուտք գործել" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "hy");
  expect(errors).toEqual([]);
});

for (const extension of ["mp4", "webm", "m3u8"]) {
  test(`real ${extension} decoding, seek and saved progress with synthetic local media`, async ({
    page,
  }) => {
    const url = `https://media.invalid/sample.${extension}`;
    const movie = {
      ...fixture[0],
      watch_url: url,
      playback_verification: {
        watch_url: url,
        license_verified: true,
        playback_verified: true,
        commercial_reuse_verified: true,
        license_source: "https://rights.invalid/proof",
        license_terms_source: "https://rights.invalid/terms",
      },
    };
    await page.route("**/rest/v1/movies?**", (route) =>
      route.fulfill({ json: [movie] }),
    );
    await page.route("https://media.invalid/**", async (route) => {
      const name = new URL(route.request().url()).pathname.slice(1);
      if (!/^(sample\.(mp4|webm|m3u8)|segment\d+\.ts)$/.test(name))
        return route.abort();
      const { fileURLToPath } = await import("node:url");
      const types = {
        mp4: "video/mp4",
        webm: "video/webm",
        m3u8: "application/vnd.apple.mpegurl",
        ts: "video/mp2t",
      };
      const { readFile } = await import("node:fs/promises");
      const bytes = await readFile(
        fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url)),
      );
      const range = route
        .request()
        .headers()
        .range?.match(/^bytes=(\d+)-(\d*)$/);
      const start = range ? Number(range[1]) : 0,
        end =
          range && range[2]
            ? Math.min(Number(range[2]), bytes.length - 1)
            : bytes.length - 1;
      return route.fulfill({
        status: range ? 206 : 200,
        body: bytes.subarray(start, end + 1),
        contentType: types[name.split(".").at(-1)],
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Accept-Ranges": "bytes",
          ...(range
            ? { "Content-Range": `bytes ${start}-${end}/${bytes.length}` }
            : {}),
        },
      });
    });
    await page.goto("./#/watch/catalog%3A1");
    const video = page.locator("video");
    await expect
      .poll(() => video.evaluate((node) => node.readyState))
      .toBeGreaterThanOrEqual(2);
    await video.evaluate((node) => node.play());
    await expect
      .poll(() => video.evaluate((node) => node.currentTime))
      .toBeGreaterThan(0.2);
    await video.evaluate((node) => {
      node.currentTime = 2;
      node.pause();
    });
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            JSON.parse(localStorage.getItem("cinewave:playback:catalog:1"))
              ?.time,
        ),
      )
      .toBeGreaterThanOrEqual(2);
    await page.reload();
    await expect
      .poll(() => page.locator("video").evaluate((node) => node.currentTime))
      .toBeGreaterThanOrEqual(2);
    await page.getByRole("button", { name: "Փակել", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Շարունակել դիտումը" }),
    ).toBeVisible();
  });
}
