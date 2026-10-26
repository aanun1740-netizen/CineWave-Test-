import { test, expect } from "@playwright/test";

test("browser decodes the fixture codecs, including H.264 via MediaSource for HLS", async ({
  page,
  browser,
}, testInfo) => {
  // No navigation or network is needed for decoder capability checks.
  const capabilities = await page.evaluate(() => {
    const video = document.createElement("video");
    const h264 = 'video/mp4; codecs="avc1.64000a"';
    return {
      h264: video.canPlayType(h264),
      h264MSE: window.MediaSource?.isTypeSupported(h264) || false,
      vp8: video.canPlayType('video/webm; codecs="vp8"'),
    };
  });
  await testInfo.attach("codec-capabilities", {
    body: JSON.stringify(
      { browser: browser.version(), ...capabilities },
      null,
      2,
    ),
    contentType: "application/json",
  });
  expect(
    capabilities.h264,
    "The committed MP4 fixture is H.264 High level 1.0; install branded Chrome with npx playwright install chrome.",
  ).toBe("probably");
  expect(
    capabilities.h264MSE,
    "HLS.js must be able to append H.264 to MediaSource.",
  ).toBe(true);
  expect(capabilities.vp8).toBe("probably");
});
