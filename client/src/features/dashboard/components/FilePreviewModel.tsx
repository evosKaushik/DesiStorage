import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  X,
  Download,
  Link2,
  Star,
  Printer,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Archive,
  FileText,
  Folder,
  Music,
  Subtitles,
  Info,
} from "lucide-react";
// import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/format";
import type {
  FileItem,
  FilePreviewType,
} from "@/store/useFileSystemStore";
import { kindFromMimeType, previewTypeFromMimeType } from "./drive/file-meta";
import { getFileStreamUrl } from "@/features/dashboard/api/file.api";
import { toast } from "react-toastify";

export type PreviewKind =
  | "folder"
  | "image"
  | "doc"
  | "sheet"
  | "video"
  | "audio"
  | "zip"
  | "pdf";

export type PreviewFile = {
  id: string;
  name: string;
  kind: PreviewKind;
  size?: string;
  modified?: string;
  owner?: string;
  url?: string;
  previewType?: FilePreviewType;
};

function toPreviewFile(item: FileItem): PreviewFile {
  return {
    id: item.id,
    name: item.name,
    kind: kindFromMimeType(item.mimeType),
    size: formatBytes(item.size),
    modified: item.updatedAt,
    owner: "You",
    url: item.url,
    previewType: item.previewType,
  };
}

type Ctx = { open: (file: FileItem) => void; close: () => void };
const PreviewCtx = createContext<Ctx | null>(null);

export function FilePreviewProvider({ children }: { children: ReactNode }) {
  const [file, setFile] = useState<PreviewFile | null>(null);

  const open = useCallback((f: FileItem) => {
    // Show the dialog instantly with what we know (name, kind…).
    setFile(toPreviewFile(f));

    // Fetch the real inline preview URL ({{BASE_URL}}/files/:id/preview) and
    // swap it in once it resolves, so images/videos/audio/pdf load lazily.
    void getFileStreamUrl(f.id)
      .then((result) => {
        if (!result.success) return;

        const { url, mimeType } = result.data;

        setFile((current) => {
          if (!current || current.id !== f.id) return current;

          return {
            ...current,
            url,
            kind: kindFromMimeType(mimeType),
            previewType: previewTypeFromMimeType(mimeType),
          };
        });
      })
      .catch(() => {
        // Keep whatever the caller already provided; the viewer will fall
        // back to the kind icon / demo content.
      });
  }, []);

  const value = useMemo<Ctx>(
    () => ({ open, close: () => setFile(null) }),
    [open],
  );
  return (
    <PreviewCtx.Provider value={value}>
      {children}
      {file && <FilePreviewModal file={file} onClose={() => setFile(null)} />}
    </PreviewCtx.Provider>
  );
}

export function useFilePreview() {
  const ctx = useContext(PreviewCtx);
  return (
    ctx ?? {
      open: () => toast.info("Preview unavailable here"),
      close: () => {},
    }
  );
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ------------------------------ Shell ------------------------------ */

function FilePreviewModal({ file, onClose }: { file: PreviewFile; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const [starred, setStarred] = useState(false);

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-neutral-950/95 backdrop-blur-sm">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/10 px-3 text-neutral-100 md:px-5">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close preview"
          className="h-9 w-9 text-neutral-300 hover:bg-white/10 hover:text-white"
        >
          <X className="h-4.5 w-4.5" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{file.name}</div>
          <div className="truncate text-[11px] text-neutral-400">
            {[file.size, file.owner && `Owner ${file.owner}`, file.modified]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>
        <Badge variant="secondary" className="hidden bg-white/10 text-neutral-200 sm:inline-flex">
          {file.kind.toUpperCase()}
        </Badge>
        <HeaderAction
          icon={Star}
          label="Star"
          active={starred}
          onClick={() => {
            setStarred((v) => !v);
            toast.success(starred ? "Removed from starred" : "Added to starred");
          }}
        />
        <HeaderAction icon={Printer} label="Print" onClick={() => toast.info("Preparing print preview…")} />
        <HeaderAction
          icon={Link2}
          label="Copy link"
          onClick={() => toast.success("Share link copied to clipboard")}
        />
        <HeaderAction
          icon={Download}
          label="Download"
          onClick={() => toast.success(`Downloading ${file.name}`)}
        />
      </header>

      <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-3 md:p-6">
        <Viewer file={file} />
      </div>
    </div>
  );
}

function HeaderAction({
  icon: Icon,
  label,
  onClick,
  active,
}: {
  icon: typeof Star;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "h-9 w-9 text-neutral-300 hover:bg-white/10 hover:text-white",
        active && "text-amber-400 hover:text-amber-300",
      )}
    >
      <Icon className={cn("h-4.5 w-4.5", active && "fill-amber-400")} />
    </Button>
  );
}

function Viewer({ file }: { file: PreviewFile }) {
  switch (file.kind) {
    case "image":
      return <ImageViewer file={file} />;
    case "video":
      return <VideoViewer file={file} />;
    case "audio":
      return <AudioViewer file={file} />;
    case "pdf":
    case "doc":
      return <DocumentViewer file={file} />;
    case "sheet":
      return <SheetViewer file={file} />;
    case "zip":
      return <ArchiveViewer file={file} />;
    default:
      return <NoPreview file={file} />;
  }
}

/* ------------------------------ Image ------------------------------ */

function ImageViewer({ file }: { file: PreviewFile }) {
  const [zoom, setZoom] = useState(1);
  const [rot, setRot] = useState(0);
  const src = file.url;

  if (!src || file.previewType !== "image") {
    return <NoPreview file={file} />;
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4">
      <div className="flex max-h-[calc(100vh-11rem)] w-full flex-1 items-center justify-center overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_70%)]">
        <img
          src={src}
          alt={file.name}
          loading="lazy"
          style={{ transform: `scale(${zoom}) rotate(${rot}deg)` }}
          className="max-h-full max-w-full rounded-xl object-contain shadow-2xl transition-transform duration-200"
        />
      </div>
      <Toolbar>
        <ToolButton icon={ZoomOut} label="Zoom out" onClick={() => setZoom((z) => Math.max(0.25, +(z - 0.25).toFixed(2)))} />
        <span className="w-14 text-center text-xs font-medium text-neutral-300">
          {Math.round(zoom * 100)}%
        </span>
        <ToolButton icon={ZoomIn} label="Zoom in" onClick={() => setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)))} />
        <Divider />
        <ToolButton icon={RotateCw} label="Rotate" onClick={() => setRot((r) => r + 90)} />
        <ToolButton icon={Maximize2} label="Fit to screen" onClick={() => { setZoom(1); setRot(0); }} />
      </Toolbar>
    </div>
  );
}

/* ------------------------------ Video ------------------------------ */

const VIDEO_DURATION = 213;

function VideoViewer({ file }: { file: PreviewFile }) {
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [volume, setVolume] = useState(70);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [captions, setCaptions] = useState(true);
  const raf = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!playing) return;
    raf.current = setInterval(() => {
      setTime((t) => {
        const next = t + 0.25 * rate;
        if (next >= VIDEO_DURATION) {
          setPlaying(false);
          return VIDEO_DURATION;
        }
        return next;
      });
    }, 250);
    return () => {
      if (raf.current) clearInterval(raf.current);
    };
  }, [playing, rate]);

  const pct = (time / VIDEO_DURATION) * 100;

  const hasRealVideo = Boolean(file.url) && file.previewType === "video";

  if (hasRealVideo) {
    return (
      <div className="flex w-full max-w-5xl flex-col gap-3">
        <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl">
          <video
            src={file.url}
            controls
            playsInline
            preload="metadata"
            className="h-full w-full"
          />
        </div>
        <MetaStrip
          items={[file.name, file.size ?? "", "Previewing from local file"]}
        />
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-5xl flex-col gap-3">
      <div className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_70%)] transition-all duration-500" />
        <button
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause" : "Play"}
          className="absolute inset-0 flex items-center justify-center"
        >
          <span
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-full bg-black/55 text-white ring-1 ring-white/25 backdrop-blur transition-all",
              playing ? "scale-90 opacity-0 group-hover:opacity-100" : "scale-100 opacity-100",
            )}
          >
            {playing ? <Pause className="h-7 w-7" /> : <Play className="ml-1 h-7 w-7" />}
          </span>
        </button>

        {captions && (
          <div className="pointer-events-none absolute inset-x-0 bottom-20 flex justify-center px-6">
            <span className="rounded-md bg-black/70 px-3 py-1.5 text-center text-sm text-white">
              {playing
                ? "…and that's how DesiStorage keeps every upload encrypted end-to-end."
                : "Press play to start the walkthrough."}
            </span>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-4 pb-3 pt-10">
          <Slider
            value={[pct]}
            max={100}
            step={0.1}
            onValueChange={(v) => {
              const val = Array.isArray(v) ? v[0] : v;
              setTime((val / 100) * VIDEO_DURATION);
            }}
            aria-label="Seek"
          />
          <div className="mt-2 flex items-center gap-2 text-neutral-200">
            <ToolButton icon={SkipBack} label="Back 10s" onClick={() => setTime((t) => Math.max(0, t - 10))} />
            <ToolButton
              icon={playing ? Pause : Play}
              label={playing ? "Pause" : "Play"}
              onClick={() => setPlaying((p) => !p)}
            />
            <ToolButton
              icon={SkipForward}
              label="Forward 10s"
              onClick={() => setTime((t) => Math.min(VIDEO_DURATION, t + 10))}
            />
            <span className="ml-1 text-xs tabular-nums text-neutral-300">
              {fmt(time)} / {fmt(VIDEO_DURATION)}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <ToolButton
                icon={muted || volume === 0 ? VolumeX : Volume2}
                label="Mute"
                onClick={() => setMuted((m) => !m)}
              />
              <div className="hidden w-24 sm:block">
                <Slider
                  value={[muted ? 0 : volume]}
                  max={100}
                  onValueChange={(v) => {
                    const val = Array.isArray(v) ? v[0] : v;
                    setVolume(val);
                    setMuted(val === 0);
                  }}
                  aria-label="Volume"
                />
              </div>
              <button
                onClick={() => setRate((r) => (r === 2 ? 0.5 : r === 0.5 ? 1 : r === 1 ? 1.5 : 2))}
                className="rounded-md px-2 py-1 text-xs font-semibold text-neutral-200 hover:bg-white/10"
              >
                {rate}×
              </button>
              <ToolButton
                icon={Subtitles}
                label="Captions"
                active={captions}
                onClick={() => setCaptions((c) => !c)}
              />
              <ToolButton icon={Maximize2} label="Fullscreen" onClick={() => toast.info("Fullscreen (demo)")} />
            </div>
          </div>
        </div>
      </div>
      <MetaStrip items={["1920×1080 · H.264", "Duration 3:33", file.size ?? "", "Streaming from Mumbai region"]} />
    </div>
  );
}

/* ------------------------------ Audio ------------------------------ */

const AUDIO_DURATION = 1864;
const BARS = Array.from({ length: 72 }, (_, i) => 25 + Math.round(60 * Math.abs(Math.sin(i * 1.7))));

function AudioViewer({ file }: { file: PreviewFile }) {
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setTime((t) => (t >= AUDIO_DURATION ? (setPlaying(false), AUDIO_DURATION) : t + 1));
    }, 250);
    return () => clearInterval(id);
  }, [playing]);

  const progress = time / AUDIO_DURATION;

  if (file.url && file.previewType === "audio") {
    return (
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-neutral-900/80 p-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400">
            <Music className="h-7 w-7" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-base font-semibold text-neutral-100">
              {file.name}
            </div>
            <div className="text-xs text-neutral-400">Audio</div>
          </div>
        </div>
        <audio
          src={file.url}
          controls
          preload="metadata"
          className="mt-6 w-full"
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-neutral-900/80 p-6 shadow-2xl">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400">
          <Music className="h-7 w-7" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-base font-semibold text-neutral-100">{file.name}</div>
          <div className="text-xs text-neutral-400">Audio · MP3 · 320 kbps</div>
        </div>
      </div>

      <div className="mt-6 flex h-24 items-end gap-[3px]">
        {BARS.map((h, i) => {
          const done = i / BARS.length <= progress;
          return (
            <button
              key={i}
              onClick={() => setTime((i / BARS.length) * AUDIO_DURATION)}
              style={{ height: `${h}%` }}
              className={cn(
                "flex-1 rounded-full transition-colors",
                done ? "bg-primary" : "bg-white/15 hover:bg-white/25",
                playing && done && "animate-pulse",
              )}
            />
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs tabular-nums text-neutral-400">
        <span>{fmt(time)}</span>
        <span>-{fmt(AUDIO_DURATION - time)}</span>
      </div>

      <div className="mt-4 flex items-center justify-center gap-3 text-neutral-200">
        <ToolButton icon={SkipBack} label="Back 15s" onClick={() => setTime((t) => Math.max(0, t - 15))} />
        <button
          onClick={() => setPlaying((p) => !p)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:brightness-110"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
        </button>
        <ToolButton icon={SkipForward} label="Forward 15s" onClick={() => setTime((t) => Math.min(AUDIO_DURATION, t + 15))} />
      </div>
    </div>
  );
}

/* ---------------------------- Documents ---------------------------- */

const DOC_PAGES = [
  {
    title: "Brand foundations",
    body: [
      "This document defines how the DesiStorage identity is applied across product, marketing and partner surfaces.",
      "Every asset should feel calm, precise and unmistakably ours — a considered balance of Indian warmth and enterprise clarity.",
      "Use the primary blue for actions and emphasis. Neutral surfaces carry the layout; colour is reserved for meaning.",
    ],
  },
  {
    title: "Logo usage",
    body: [
      "The mark must always keep clear space equal to the height of the cloud on all four sides.",
      "Never rotate, recolour, stretch or add effects to the mark. Monochrome variants exist for single-colour printing.",
      "On dark surfaces use the inverse lockup; on photography use the solid container variant.",
    ],
  },
  {
    title: "Typography & layout",
    body: [
      "Inter is the single typeface across product and web. Headings use 600–700 weights with tight tracking.",
      "Body copy sits at 15–16px with 1.6 line height. Cards use a 16px corner radius throughout.",
      "Grids are 12-column with 24px gutters on desktop and a single column below 768px.",
    ],
  },
];

function DocumentViewer({ file }: { file: PreviewFile }) {
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const total = DOC_PAGES.length;

  if (
    file.url &&
    (file.previewType === "pdf" || file.previewType === "text")
  ) {
    return (
      <div className="flex h-[calc(100vh-8rem)] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-neutral-900 shadow-2xl">
        <iframe src={file.url} title={file.name} className="h-full w-full border-0" />
      </div>
    );
  }
  const p = DOC_PAGES[page - 1];

  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-4">
      <div
        style={{ transform: `scale(${zoom})` }}
        className="w-full origin-top rounded-lg bg-white p-8 text-neutral-900 shadow-2xl transition-transform md:p-12"
      >
        <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
            DesiStorage
          </span>
          <span className="text-[11px] text-neutral-400">
            {file.kind.toUpperCase()} · Page {page} of {total}
          </span>
        </div>
        <h2 className="mt-8 text-2xl font-bold tracking-tight">{p.title}</h2>
        <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-neutral-700">
          {p.body.map((t) => (
            <p key={t}>{t}</p>
          ))}
        </div>
        <div className="mt-8 grid grid-cols-3 gap-3">
          {["Primary", "Ink", "Surface"].map((c, i) => (
            <div key={c} className="rounded-lg border border-neutral-200 p-3">
              <div
                className={cn(
                  "h-10 rounded-md",
                  i === 0 ? "bg-blue-600" : i === 1 ? "bg-neutral-900" : "bg-neutral-100",
                )}
              />
              <div className="mt-2 text-xs font-medium text-neutral-500">{c}</div>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-neutral-200 pt-4 text-[11px] text-neutral-400">
          Confidential — internal distribution only
        </div>
      </div>

      <Toolbar>
        <ToolButton icon={ChevronLeft} label="Previous page" onClick={() => setPage((n) => Math.max(1, n - 1))} />
        <span className="w-20 text-center text-xs font-medium text-neutral-300">
          {page} / {total}
        </span>
        <ToolButton icon={ChevronRight} label="Next page" onClick={() => setPage((n) => Math.min(total, n + 1))} />
        <Divider />
        <ToolButton icon={ZoomOut} label="Zoom out" onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.1).toFixed(2)))} />
        <span className="w-14 text-center text-xs font-medium text-neutral-300">{Math.round(zoom * 100)}%</span>
        <ToolButton icon={ZoomIn} label="Zoom in" onClick={() => setZoom((z) => Math.min(1.8, +(z + 0.1).toFixed(2)))} />
      </Toolbar>
    </div>
  );
}

/* ------------------------------ Sheet ------------------------------ */

const SHEET_TABS = ["Summary", "Revenue", "Costs", "Headcount"];
const SHEET_HEAD = ["Line item", "Q1", "Q2", "Q3", "Q4", "FY total"];
const SHEET_ROWS: string[][] = [
  ["Subscription revenue", "₹1.24 Cr", "₹1.41 Cr", "₹1.68 Cr", "₹1.92 Cr", "₹6.25 Cr"],
  ["Storage overage", "₹18.2 L", "₹21.4 L", "₹24.9 L", "₹28.1 L", "₹92.6 L"],
  ["Enterprise contracts", "₹62.0 L", "₹74.5 L", "₹81.2 L", "₹96.4 L", "₹3.14 Cr"],
  ["Infrastructure cost", "-₹38.4 L", "-₹41.2 L", "-₹45.8 L", "-₹49.1 L", "-₹1.74 Cr"],
  ["Support & success", "-₹12.1 L", "-₹13.0 L", "-₹14.4 L", "-₹15.2 L", "-₹54.7 L"],
  ["Marketing spend", "-₹22.6 L", "-₹27.9 L", "-₹31.4 L", "-₹36.8 L", "-₹1.18 Cr"],
  ["Net margin", "₹51.1 L", "₹63.8 L", "₹74.5 L", "₹88.4 L", "₹2.77 Cr"],
];

function SheetViewer({ file }: { file: PreviewFile }) {
  const [active, setActive] = useState(SHEET_TABS[0]);
  return (
    <div className="flex w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
      <div className="flex items-center gap-2 border-b border-neutral-200 bg-neutral-50 px-4 py-2 text-xs text-neutral-500">
        <span className="font-semibold text-neutral-700">{file.name}</span>
        <span>· Read-only preview</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm text-neutral-800">
          <thead>
            <tr>
              <th className="w-10 border border-neutral-200 bg-neutral-100 p-2 text-[11px] font-medium text-neutral-400" />
              {SHEET_HEAD.map((h) => (
                <th
                  key={h}
                  className="border border-neutral-200 bg-neutral-100 px-3 py-2 text-left text-xs font-semibold text-neutral-600"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHEET_ROWS.map((row, i) => (
              <tr key={row[0]} className={i === SHEET_ROWS.length - 1 ? "font-semibold" : undefined}>
                <td className="border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-center text-[11px] text-neutral-400">
                  {i + 1}
                </td>
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className={cn(
                      "border border-neutral-200 px-3 py-1.5 tabular-nums",
                      j === 0 && "font-medium",
                      j > 0 && "text-right",
                      cell.startsWith("-") && "text-red-600",
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-1 border-t border-neutral-200 bg-neutral-50 px-3 py-2">
        {SHEET_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium transition-colors",
              active === t
                ? "bg-white text-neutral-900 shadow-sm ring-1 ring-neutral-200"
                : "text-neutral-500 hover:bg-neutral-200/60",
            )}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------- Archive ----------------------------- */

const ZIP_ENTRIES = [
  { name: "assets/logo-primary.svg", size: "24 KB", type: "SVG" },
  { name: "assets/logo-mono.svg", size: "21 KB", type: "SVG" },
  { name: "images/hero@2x.png", size: "4.1 MB", type: "PNG" },
  { name: "images/feature-grid.png", size: "2.8 MB", type: "PNG" },
  { name: "fonts/Inter-Variable.woff2", size: "312 KB", type: "WOFF2" },
  { name: "docs/handoff-notes.pdf", size: "1.2 MB", type: "PDF" },
  { name: "index.html", size: "18 KB", type: "HTML" },
];

function ArchiveViewer({ file }: { file: PreviewFile }) {
  return (
    <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/80 shadow-2xl">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400">
          <Archive className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-semibold text-neutral-100">{file.name}</div>
          <div className="text-xs text-neutral-400">
            {ZIP_ENTRIES.length} items · compressed archive
          </div>
        </div>
      </div>
      <ul className="divide-y divide-white/5">
        {ZIP_ENTRIES.map((e) => (
          <li key={e.name} className="flex items-center gap-3 px-5 py-3 text-sm hover:bg-white/5">
            <FileText className="h-4 w-4 shrink-0 text-neutral-500" />
            <span className="min-w-0 flex-1 truncate text-neutral-200">{e.name}</span>
            <span className="w-16 shrink-0 text-xs text-neutral-500">{e.type}</span>
            <span className="w-20 shrink-0 text-right text-xs tabular-nums text-neutral-400">{e.size}</span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-white/10 px-5 py-3">
        <span className="text-xs text-neutral-400">Extract to preview individual files</span>
        <Button size="sm" onClick={() => toast.success("Extracting archive…")}>
          Extract all
        </Button>
      </div>
    </div>
  );
}

/* ---------------------------- Fallback ----------------------------- */

function NoPreview({ file }: { file: PreviewFile }) {
  return (
    <div className="flex max-w-md flex-col items-center gap-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5 text-neutral-400">
        {file.kind === "folder" ? <Folder className="h-9 w-9" /> : <Info className="h-9 w-9" />}
      </div>
      <div>
        <div className="text-base font-semibold text-neutral-100">
          {file.kind === "folder" ? "Folders open in Drive" : "No preview available"}
        </div>
        <p className="mt-1 text-sm text-neutral-400">
          {file.kind === "folder"
            ? "Open this folder to browse everything inside it."
            : "We can't render this file type yet. Download it to view on your device."}
        </p>
      </div>
      <Button onClick={() => toast.success(`Downloading ${file.name}`)} className="gap-2">
        <Download className="h-4 w-4" /> Download
      </Button>
    </div>
  );
}

/* ----------------------------- Shared UI ---------------------------- */

function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-white/10 bg-neutral-900/80 px-2 py-1.5 shadow-lg backdrop-blur">
      {children}
    </div>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-white/10" />;
}

function ToolButton({
  icon: Icon,
  label,
  onClick,
  active,
}: {
  icon: typeof Play;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full text-neutral-300 transition-colors hover:bg-white/10 hover:text-white",
        active && "text-primary",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function MetaStrip({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-neutral-400">
      {items.filter(Boolean).map((i) => (
        <span key={i}>{i}</span>
      ))}
    </div>
  );
}
