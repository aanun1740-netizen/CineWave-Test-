import { describe, expect, it } from "vitest";
import { vkEmbedUrl } from "./vk-embed";

describe("vkEmbedUrl", () => {
  it("converts official VK video pages to the dedicated player", () => {
    expect(vkEmbedUrl("https://vkvideo.ru/video-220018529_456248794"))
      .toBe("https://vkvideo.ru/video_ext.php?oid=-220018529&id=456248794");
  });
  it("accepts VK iframe markup and keeps a valid access hash", () => {
    const input = '<iframe src="https://vk.ru/video_ext.php?oid=-234265537&amp;id=456239656&amp;hash=abc123"></iframe>';
    expect(vkEmbedUrl(input))
      .toBe("https://vkvideo.ru/video_ext.php?oid=-234265537&id=456239656&hash=abc123");
  });
  it("also accepts player URLs without optional hash", () => {
    expect(vkEmbedUrl("https://vk.ru/video_ext.php?oid=-12&id=34&hash="))
      .toBe("https://vkvideo.ru/video_ext.php?oid=-12&id=34");
  });
  it("rejects shortened links, fake hosts and unsafe schemes", () => {
    for (const input of [
      "https://vk.cc/d3SBfV",
      "https://vkvideo.ru.evil.com/video-1_2",
      "javascript:alert(1)",
      "http://vkvideo.ru/video-1_2",
      '<iframe src="https://example.com/video_ext.php?oid=-1&amp;id=2"></iframe>',
      "https://vkvideo.ru/video_ext.php?id=34",
    ]) expect(vkEmbedUrl(input)).toBeNull();
  });
});
