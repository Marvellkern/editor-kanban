import { useRef } from "react";
import { PRODUCT_NAME, CREDIT_LINK } from "../config";
import { useBoard, useUI, type TypeFilter } from "../store";
import { SAMPLE_CARD_IDS } from "../lib/defaults";
import { exportBoard, importBoardFile } from "../lib/backup";
import { SketchButton, SketchInput } from "../sketch/primitives";
import { CloseIcon, DownloadIcon, FilmIcon, SearchIcon, UploadIcon } from "../sketch/icons";
import { SketchBox, hashSeed } from "../sketch/SketchBox";

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "short", label: "Short" },
  { value: "longform", label: "Long-form" },
  { value: "other", label: "Other" },
];

export function Header() {
  const search = useUI((s) => s.search);
  const setSearch = useUI((s) => s.setSearch);
  const typeFilter = useUI((s) => s.typeFilter);
  const setTypeFilter = useUI((s) => s.setTypeFilter);
  const dueThisWeek = useUI((s) => s.dueThisWeek);
  const setDueThisWeek = useUI((s) => s.setDueThisWeek);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <header className="topbar">
      <div className="brand">
        <FilmIcon size={30} />
        <span className="brand__name">{PRODUCT_NAME}</span>
      </div>

      <div className="filters" role="search">
        <div className="search">
          <label htmlFor="search" className="visually-hidden">Search videos by title or client</label>
          <SearchIcon className="search__icon" size={18} />
          <SketchInput
            id="search"
            type="search"
            value={search}
            placeholder="Search title or client"
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setSearch("")}
          />
        </div>
        <div className="filter-chips">
        <div className="seg" role="group" aria-label="Video type">
          {TYPE_OPTIONS.map((o) => (
            <SketchButton
              key={o.value}
              variant="chip"
              size="sm"
              seedKey={`type-${o.value}`}
              pressed={typeFilter === o.value}
              onClick={() => setTypeFilter(o.value)}
            >
              {o.label}
            </SketchButton>
          ))}
        </div>
        <SketchButton variant="chip" size="sm" seedKey="due-week" pressed={dueThisWeek} onClick={() => setDueThisWeek(!dueThisWeek)}>
          Due this week
        </SketchButton>
        </div>
      </div>

      <div className="actions">
        <SketchButton size="sm" seedKey="export" onClick={exportBoard} aria-label="Export board as a backup file">
          <DownloadIcon size={18} /> <span className="hide-sm">Export</span>
        </SketchButton>
        <SketchButton size="sm" seedKey="import" onClick={() => fileRef.current?.click()} aria-label="Import board from a backup file">
          <UploadIcon size={18} /> <span className="hide-sm">Import</span>
        </SketchButton>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="visually-hidden"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = ""; // allow picking the same file again
            if (file) void importBoardFile(file);
          }}
        />
      </div>
    </header>
  );
}

export function NoticeBar() {
  const dismissed = useBoard((s) => s.board.flags.backupNoticeDismissed);
  const sampleCleared = useBoard((s) => s.board.flags.sampleCleared);
  const hasSamples = useBoard((s) => SAMPLE_CARD_IDS.some((id) => id in s.board.cards));
  const { dismissBackupNotice, clearSamples } = useBoard.getState();
  const showToast = useUI((s) => s.showToast);
  const showSamples = !sampleCleared && hasSamples;
  if (dismissed && !showSamples) return null;

  return (
    <div className="noticebar">
      {!dismissed && (
        <p className="notice">
          <SketchBox seed={hashSeed("notice")} fill="var(--hl-yellow)" roughness={1.6} />
          <span>Your board is saved in this browser only. Use Export to back it up.</span>
          <button type="button" className="icon-btn icon-btn--sm" onClick={dismissBackupNotice} aria-label="Dismiss backup notice">
            <CloseIcon size={16} />
          </button>
        </p>
      )}
      {showSamples && (
        <SketchButton
          size="sm"
          seedKey="clear-samples"
          onClick={() => {
            clearSamples();
            showToast({ message: "Sample cards cleared. The board is all yours." });
          }}
        >
          Clear sample cards
        </SketchButton>
      )}
    </div>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <span>{PRODUCT_NAME}</span>
      <span aria-hidden="true">·</span>
      <span>Your data stays in this browser</span>
      <span aria-hidden="true">·</span>
      <a href={CREDIT_LINK.href}>{CREDIT_LINK.label}</a>
    </footer>
  );
}
