import { useState } from "react";
import { EmptyState } from "../components/PageChrome.tsx";

const CHAPTERS = [
  { id: "act-1", label: "第一章" },
  { id: "act-2", label: "第二章" },
  { id: "act-3", label: "第三章" },
  { id: "act-4", label: "第四章" },
  { id: "act-5", label: "第五章" },
];

export default function ChaptersPage() {
  const [active, setActive] = useState(CHAPTERS[0].id);
  const current = CHAPTERS.find((c) => c.id === active) ?? CHAPTERS[0];

  return (
    <div>
      <ol className="mb-6 flex flex-wrap gap-2">
        {CHAPTERS.map((chapter, index) => (
          <li key={chapter.id}>
            <button
              type="button"
              onClick={() => setActive(chapter.id)}
              className={`rounded-sm border px-3 py-2 text-sm ${
                chapter.id === active
                  ? "border-gold bg-gold/15 text-gold"
                  : "border-line text-muted hover:text-paper"
              }`}
            >
              <span className="mr-2 font-mono text-xs text-gold-dim">
                {String(index + 1).padStart(2, "0")}
              </span>
              {chapter.label}
            </button>
          </li>
        ))}
      </ol>
      <EmptyState
        title={`${current.label}地圖`}
        description="章節關卡與商店節點稍後填入。此列僅佔位，方便之後接上實際地圖與商店正則。"
      />
    </div>
  );
}
