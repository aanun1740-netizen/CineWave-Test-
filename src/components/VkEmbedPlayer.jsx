import { vkEmbedUrl } from "../services/vk-embed";

const labels = {
  hy: { player: "Ֆիլմի դիտում", fallback: "Բացել VK-ի նվագարկիչում",
        note: "Տեսանյութը ցուցադրվում է VK Video-ի ներդրված փլեյերով։ Հասանելիությունն ու նվագարկման կառավարումը կախված են VK-ից։" },
  ru: { player: "Просмотр фильма", fallback: "Открыть в плеере VK",
        note: "Видео воспроизводится встроенным плеером VK Video. Доступность и элементы управления зависят от VK." },
  en: { player: "Movie playback", fallback: "Open in VK player",
        note: "Video uses VK Video's embedded player. Availability and player controls are managed by VK." },
};

export default function VkEmbedPlayer({ url, title, language = "en" }) {
  const source = vkEmbedUrl(url);
  if (!source) return null;
  const copy = labels[language] || labels.en;
  return (
    <div className="kinolab-vk-embed" style={{ width: "100%", background: "#000" }}>
      <iframe
        title={title ? copy.player + ": " + title : copy.player}
        src={source}
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        style={{ width: "100%", aspectRatio: "16 / 9", border: 0, display: "block", background: "#000" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px",
                    padding: "9px 12px", color: "#b7b6c5", fontSize: "12px" }}>
        <span>{copy.note}</span>
        <a href={source} target="_blank" rel="noopener noreferrer" style={{ color: "#D4F458" }}>
          {copy.fallback}
        </a>
      </div>
    </div>
  );
}
