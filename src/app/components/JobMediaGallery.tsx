// Job photos, videos and files (M4-9) — the Documents column of the job page.
// Each photo carries its type badge (Before / After / Other / Report Card · P3),
// a description and "Captured Oct 29, 9:14 AM by Tom". Filters: All · Before ·
// After · Other · Report Card · Video · Files, and Added by. Videos play in the
// gallery. Labels: "Added from the device after completion", "Drawn copy of
// photo 1". Upload: one type for the whole batch (Other by default), changeable
// later on one photo. New photos from the app appear with no reload (demo
// button). Thumbnails load 50 at a time, the rest as you scroll.
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import acPhoto from "../../assets/documents/33897-cu.jpg";
import installAcPhoto from "../../assets/documents/34689-install-ac.jpg";
import heaterPhoto from "../../assets/documents/34285-install-water-heater.jpg";
import ductsPhoto from "../../assets/documents/33805-install-ducts-vents.jpg";
import heatingPhoto from "../../assets/documents/33702-install-heating-system.jpg";
import panelPhoto from "../../assets/documents/34610-install-outlet-outdoor-electrical-panel.jpg";
import walkthroughVideo from "../../assets/documents/job-walkthrough.mp4";

export type MediaTag = "Before" | "After" | "Other" | "Report Card";
export interface MediaItem {
  id: string;
  kind: "photo" | "video" | "file";
  url?: string;
  name: string;
  tag: MediaTag;
  /** Report Card page. */
  page?: number;
  description: string;
  capturedAt: string;
  by: string;
  afterCompletion?: boolean;
  /** "Drawn copy of photo N". */
  drawnFrom?: number;
  /** The original's id, so the copy sits right next to it. */
  drawnOf?: string;
}

const TAGS: MediaTag[] = ["Before", "After", "Other", "Report Card"];
const FILTERS = ["All", "Before", "After", "Other", "Report Card", "Video", "Files"] as const;
type Filter = (typeof FILTERS)[number];
const PAGE = 50;
const TAG_STYLE: Record<MediaTag, { fg: string; bg: string }> = {
  Before: { fg: "#1D4ED8", bg: "#DBEAFE" },
  After: { fg: "#15803D", bg: "#DCFCE7" },
  Other: { fg: "#374151", bg: "#F3F4F6" },
  "Report Card": { fg: "#7C3AED", bg: "#EDE9FE" },
};

const tagLabel = (m: MediaItem) => (m.tag === "Report Card" && m.page ? `Report Card · P${m.page}` : m.tag);
const capturedLabel = (m: MediaItem) => {
  const d = new Date(m.capturedAt);
  return `Captured ${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} by ${m.by}`;
};
/** Before / After / Other / Report Card count photos only; videos and files have their own filters. */
const matches = (m: MediaItem, f: Filter) =>
  f === "All" ? true : f === "Video" ? m.kind === "video" : f === "Files" ? m.kind === "file" : m.kind === "photo" && m.tag === f;

// ── Per-job store (in memory — new items arrive from the hub in production) ──
const PICS = [acPhoto, installAcPhoto, heaterPhoto, ductsPhoto, heatingPhoto, panelPhoto];
const DESCS = ["Condenser before cleaning", "Old capacitor, swollen top", "New capacitor installed", "Coil after the wash", "Line set, insulation replaced", "Thermostat wiring", "Filter, as found", "Breaker panel", "Drain line cleared", "Unit running, readings OK"];
function seedFor(tech: string): MediaItem[] {
  const base = new Date("2026-10-29T09:14:00").getTime();
  const out: MediaItem[] = [];
  for (let i = 0; i < 62; i++) {
    const tag: MediaTag = i >= 40 && i < 44 ? "Report Card" : (["Before", "After", "After", "Other"] as MediaTag[])[i % 4];
    out.push({
      id: `m${i + 1}`, kind: "photo", url: PICS[i % PICS.length], name: `Photo ${i + 1}.jpg`, tag,
      page: tag === "Report Card" ? i - 39 : undefined,
      description: DESCS[i % DESCS.length], capturedAt: new Date(base + i * 4 * 60000).toISOString(), by: i % 9 === 8 ? "Helen" : tech,
    });
  }
  out[19] = { ...out[19], description: "Marked-up copy: where the leak was", drawnFrom: 1 };
  out.push({ id: "v1", kind: "video", url: walkthroughVideo, name: "Walkthrough.mp4", tag: "After", description: "Walkthrough after the repair", capturedAt: new Date(base + 70 * 60000).toISOString(), by: tech });
  out.push({ id: "m-late", kind: "photo", url: PICS[2], name: "Photo late.jpg", tag: "After", description: "Extra photo of the finished unit", capturedAt: new Date(base + 9 * 3600000).toISOString(), by: tech, afterCompletion: true });
  out.push({ id: "f1", kind: "file", name: "Warranty registration.pdf", tag: "Other", description: "Manufacturer warranty form", capturedAt: new Date(base + 80 * 60000).toISOString(), by: "Helen" });
  return out;
}
// 10512-J02 (scenario): 12 items, all from Tom — 4 Before, 6 After (one is a drawn copy of
// the capacitor photo, next to the original), 1 Report Card · P3, 1 video.
function seed10512(): MediaItem[] {
  const t = (hm: string) => new Date(`2026-10-29T${hm}:00`).toISOString();
  const p = (id: string, url: string, tag: MediaTag, description: string, hm: string, extra: Partial<MediaItem> = {}): MediaItem =>
    ({ id, kind: "photo", url, name: `${id}.jpg`, tag, description, capturedAt: t(hm), by: "Tom", ...extra });
  return [
    p("b1", acPhoto, "Before", "Condenser as found", "09:12"),
    p("b2", panelPhoto, "Before", "Disconnect box, power off", "09:14"),
    p("b3", acPhoto, "Before", "Old capacitor, swollen top", "09:20"),
    p("b4", heatingPhoto, "Before", "Thermostat reading 81°F", "09:22"),
    p("rc3", ductsPhoto, "Report Card", "Filter condition", "09:40", { page: 3 }),
    p("a1", installAcPhoto, "After", "Coil after the wash", "10:20"),
    p("a2", panelPhoto, "After", "Wiring tightened", "10:28"),
    p("a3", installAcPhoto, "After", "Unit running, readings OK", "10:36"),
    p("a4", heatingPhoto, "After", "Thermostat reading 72°F", "10:38"),
    p("a5", heaterPhoto, "After", "New capacitor installed", "10:42"),
    p("a6", heaterPhoto, "After", "New capacitor installed — terminals circled", "10:42", { drawnFrom: 10, drawnOf: "a5" }),
    { id: "v1", kind: "video", url: walkthroughVideo, name: "Walkthrough.mp4", tag: "Other", description: "Unit running after the repair", capturedAt: t("10:45"), by: "Tom" },
  ];
}
// A big job: 1,000 photos — thumbnails come 50 at a time; filters search the whole job.
function seedBig(tech: string): MediaItem[] {
  const base = new Date("2026-09-14T08:00:00").getTime();
  return Array.from({ length: 1000 }, (_, i) => {
    const tag = (["Before", "After", "After", "Other"] as MediaTag[])[i % 4];
    return { id: `big${i + 1}`, kind: "photo" as const, url: PICS[i % PICS.length], name: `Photo ${i + 1}.jpg`, tag, description: `${DESCS[i % DESCS.length]} · room ${Math.floor(i / 25) + 1}`, capturedAt: new Date(base + i * 3 * 60000).toISOString(), by: i % 7 === 6 ? "Helen" : tech };
  });
}
/** Job pages with a scenario gallery. */
const SEEDS: Record<string, (tech: string) => MediaItem[]> = { "10512": seed10512, "2": seedBig };
/** Where "Demo: Tom uploads 3 photos" lands in time on the scenario job (10:50 AM that day). */
const DEMO_AT: Record<string, string> = { "10512": "2026-10-29T10:50:00" };
const byJob = new Map<string, MediaItem[]>();
const listeners = new Set<() => void>();
const mediaStore = {
  subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); },
  get(jobKey: string, tech: string) { if (!byJob.has(jobKey)) byJob.set(jobKey, (SEEDS[jobKey] ?? seedFor)(tech)); return byJob.get(jobKey)!; },
  set(jobKey: string, next: MediaItem[]) { byJob.set(jobKey, next); listeners.forEach((l) => l()); },
};

export function JobMediaGallery({ jobKey, techFirst }: { jobKey: string; techFirst: string }) {
  const tech = techFirst || "Tom";
  mediaStore.get(jobKey, tech); // seed before subscribing so the snapshot is stable
  const items = useSyncExternalStore(mediaStore.subscribe, () => byJob.get(jobKey)!);
  const [filter, setFilter] = useState<Filter>("All");
  const [addedBy, setAddedBy] = useState("all");
  const [shown, setShown] = useState(PAGE);
  const [selId, setSelId] = useState<string | null>(null);
  const [pending, setPending] = useState<File[] | null>(null);
  const [batchTag, setBatchTag] = useState<MediaTag>("Other");
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const people = useMemo(() => Array.from(new Set(items.map((m) => m.by))), [items]);
  /** Count per filter chip — over the whole job (and the Added by choice), not just the thumbnails shown. */
  const counts = useMemo(() => {
    const pool = items.filter((m) => addedBy === "all" || m.by === addedBy);
    return Object.fromEntries(FILTERS.map((f) => [f, pool.filter((m) => matches(m, f)).length])) as Record<Filter, number>;
  }, [items, addedBy]);
  const list = useMemo(() => {
    const f = items.filter((m) => (addedBy === "all" || m.by === addedBy) && matches(m, filter));
    // Newest first; a drawn copy goes right after its original.
    const sorted = f.filter((m) => !m.drawnOf || !f.some((o) => o.id === m.drawnOf)).sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
    return sorted.flatMap((m) => [m, ...f.filter((c) => c.drawnOf === m.id)]);
  }, [items, filter, addedBy]);
  useEffect(() => setShown(PAGE), [filter, addedBy]);
  // Next 50 when the end of the grid scrolls into view.
  useEffect(() => {
    const el = sentinelRef.current, root = gridRef.current;
    if (!el || !root) return;
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) setShown((n) => Math.min(n + PAGE, list.length)); }, { root, rootMargin: "120px" });
    io.observe(el);
    return () => io.disconnect();
  }, [list.length, shown]);

  const sel = list.find((m) => m.id === selId) ?? list[0];
  const patch = (id: string, p: Partial<MediaItem>) => mediaStore.set(jobKey, items.map((m) => (m.id === id ? { ...m, ...p } : m)));
  const add = (next: MediaItem[]) => {
    mediaStore.set(jobKey, [...next, ...items]);
    setFresh(new Set(next.map((m) => m.id)));
    setTimeout(() => setFresh(new Set()), 4000);
  };
  const upload = () => {
    if (!pending) return;
    const now = new Date().toISOString();
    add(pending.map((f, i) => ({
      id: `u${Date.now()}-${i}`, kind: f.type.startsWith("video/") ? "video" : f.type.startsWith("image/") ? "photo" : "file",
      url: f.type.startsWith("image/") || f.type.startsWith("video/") ? URL.createObjectURL(f) : undefined,
      name: f.name, tag: batchTag, description: "", capturedAt: now, by: "Helen",
    })));
    setPending(null); setBatchTag("Other");
  };
  const demoUpload = () => {
    const now = DEMO_AT[jobKey] ? new Date(DEMO_AT[jobKey]).getTime() + 40000 : Date.now();
    add([0, 1, 2].map((i) => ({ id: `demo${now}-${i}`, kind: "photo" as const, url: PICS[(i + 3) % PICS.length], name: `IMG_${now % 10000 + i}.jpg`, tag: "After" as const, description: ["Condenser fan, new capacitor wired", "Pad leveled", "Unit tagged with service date"][i], capturedAt: new Date(now - (2 - i) * 20000).toISOString(), by: tech })));
  };

  return (
    <div className="flex h-full min-h-[440px] flex-col overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
      <div className="space-y-2 border-b border-[#E5E7EB] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>Photos & files <span className="text-[13px] text-[#6B7280]" style={{ fontWeight: 500 }}>{items.length}</span></div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={demoUpload} className="inline-flex h-8 items-center gap-1 rounded-lg border border-dashed border-[#C5D5EC] px-2.5 text-[12px] text-[#4A6FA5] hover:bg-[#F5F8FD]" style={{ fontWeight: 500 }} title="Prototype only — shows photos arriving live">
              <span className="material-icons" style={{ fontSize: 15 }}>bolt</span>Demo: {tech} uploads 3 photos
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#4A6FA5] px-3 text-[13px] text-white hover:bg-[#3d5a85]" style={{ fontWeight: 500 }}>
              <span className="material-icons" style={{ fontSize: 16 }}>upload</span>Upload
            </button>
            <input ref={fileRef} type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx" className="hidden"
              onChange={(e) => { const f = Array.from(e.target.files ?? []); if (f.length) setPending(f); e.target.value = ""; }} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTERS.map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className={`h-7 rounded-full px-2.5 text-[12px] transition-colors ${filter === f ? "bg-[#4A6FA5] text-white" : "bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]"}`} style={{ fontWeight: 500 }}>
              {f} <span className={filter === f ? "text-white/80" : "text-[#6B7280]"}>{counts[f].toLocaleString("en-US")}</span>
            </button>
          ))}
          <select value={addedBy} onChange={(e) => setAddedBy(e.target.value)} aria-label="Added by"
            className="ml-auto h-7 rounded-lg border border-[#E5E7EB] bg-white px-2 text-[12px] text-[#1A2332] outline-none">
            <option value="all">Added by: anyone</option>
            {people.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div ref={gridRef} className="w-[46%] min-w-[180px] overflow-y-auto border-r border-[#E5E7EB] p-2" style={{ maxHeight: 620 }}>
          {list.length === 0 && <div className="py-10 text-center text-[12px] text-[#9CA3AF]">Nothing here</div>}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-1.5">
            {list.slice(0, shown).map((m) => (
              <button key={m.id} type="button" onClick={() => setSelId(m.id)}
                className={`relative aspect-square overflow-hidden rounded-md border ${sel?.id === m.id ? "border-[#4A6FA5] ring-2 ring-[#4A6FA5]/30" : "border-[#E5E7EB]"} ${fresh.has(m.id) ? "ring-2 ring-[#16A34A]" : ""} bg-[#F3F4F6]`}
                title={`${m.kind === "video" ? "Video" : m.kind === "file" ? "File" : tagLabel(m)} · ${m.description}`}>
                {m.kind === "photo" && <img src={m.url} alt={m.description || m.name} loading="lazy" className="h-full w-full object-cover" />}
                {m.kind === "video" && (<><video src={m.url} muted preload="metadata" className="h-full w-full object-cover" /><span className="material-icons absolute inset-0 m-auto h-fit w-fit rounded-full bg-black/50 text-white" style={{ fontSize: 22 }}>play_arrow</span></>)}
                {m.kind === "file" && <span className="material-icons absolute inset-0 m-auto h-fit w-fit text-[#DC2626]" style={{ fontSize: 30 }}>picture_as_pdf</span>}
                {m.kind === "photo" && (
                  <span className="absolute left-1 top-1 rounded px-1 text-[9px] leading-[14px]" style={{ fontWeight: 700, color: TAG_STYLE[m.tag].fg, backgroundColor: TAG_STYLE[m.tag].bg }}>{tagLabel(m)}</span>
                )}
                {m.kind === "video" && <span className="absolute left-1 top-1 rounded bg-black/60 px-1 text-[9px] leading-[14px] text-white" style={{ fontWeight: 700 }}>Video</span>}
                {m.drawnFrom && <span className="absolute bottom-1 left-1 rounded bg-[#FFFBEB] px-1 text-[9px] leading-[14px] text-[#92400E]" style={{ fontWeight: 700 }}>Drawn copy</span>}
                {m.afterCompletion && <span className="material-icons absolute bottom-1 right-1 rounded-full bg-white/90 text-[#B45309]" style={{ fontSize: 13 }}>schedule</span>}
                {fresh.has(m.id) && <span className="absolute bottom-1 left-1 rounded bg-[#16A34A] px-1 text-[9px] text-white" style={{ fontWeight: 700 }}>NEW</span>}
              </button>
            ))}
          </div>
          {list.length > PAGE && <div className="pt-2 text-center text-[11px] text-[#9CA3AF]">Showing {Math.min(shown, list.length).toLocaleString("en-US")} of {list.length.toLocaleString("en-US")}</div>}
          {shown < list.length && <div ref={sentinelRef} className="py-3 text-center text-[11px] text-[#9CA3AF]">Loading more…</div>}
        </div>

        <div className="min-w-0 flex-1 overflow-y-auto p-3">
          {sel ? (
            <>
              <div className="overflow-hidden rounded-lg bg-[#0F172A]/5">
                {sel.kind === "photo" && <img src={sel.url} alt={sel.description || sel.name} className="max-h-[360px] w-full object-contain" />}
                {sel.kind === "video" && <video key={sel.id} src={sel.url} controls playsInline className="max-h-[360px] w-full bg-black" />}
                {sel.kind === "file" && <div className="flex h-[200px] flex-col items-center justify-center gap-1 text-[13px] text-[#374151]"><span className="material-icons text-[#DC2626]" style={{ fontSize: 40 }}>picture_as_pdf</span>{sel.name}</div>}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {sel.kind === "photo" && (
                  <select value={sel.tag} onChange={(e) => patch(sel.id, { tag: e.target.value as MediaTag, page: e.target.value === "Report Card" ? sel.page ?? 1 : undefined })} aria-label="Photo type"
                    className="h-7 rounded-md px-2 text-[12px] outline-none" style={{ fontWeight: 600, color: TAG_STYLE[sel.tag].fg, backgroundColor: TAG_STYLE[sel.tag].bg }}>
                    {TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                )}
                {sel.tag === "Report Card" && sel.page && <span className="text-[12px] text-[#7C3AED]" style={{ fontWeight: 600 }}>Page {sel.page}</span>}
                {sel.afterCompletion && <span className="rounded-md bg-[#FFFBEB] px-2 py-0.5 text-[12px] text-[#92400E]" style={{ fontWeight: 500 }}>Added from the device after completion</span>}
                {sel.drawnFrom && <span className="rounded-md bg-[#FFFBEB] px-2 py-0.5 text-[12px] text-[#92400E]" style={{ fontWeight: 500 }}>{(() => { const o = sel.drawnOf ? items.find((x) => x.id === sel.drawnOf) : undefined; return o ? <>Drawn copy of “{o.description}” · <button type="button" className="underline" onClick={() => setSelId(o.id)}>original</button> unchanged</> : <>Drawn copy of photo {sel.drawnFrom}</>; })()}</span>}
              </div>
              <input value={sel.description} onChange={(e) => patch(sel.id, { description: e.target.value })} placeholder="Add a description"
                className="mt-2 h-9 w-full rounded-lg border border-[#E5E7EB] px-3 text-[14px] text-[#1A2332] outline-none focus:border-[#4A6FA5]" aria-label="Description" />
              <div className="mt-1.5 text-[12px] text-[#6B7280]">{capturedLabel(sel)}</div>
            </>
          ) : <div className="py-16 text-center text-[12px] text-[#9CA3AF]">Nothing to preview</div>}
        </div>
      </div>

      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setPending(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative w-full max-w-[420px] rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Upload">
            <div className="text-[18px] text-[#1A2332]" style={{ fontWeight: 600 }}>Upload {pending.length} {pending.length === 1 ? "file" : "files"}</div>
            <div className="mt-1 text-[13px] text-[#6B7280]">One type for the whole batch. You can change it on any single photo later.</div>
            <label className="mt-4 block text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>Type</label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {TAGS.map((t) => (
                <button key={t} type="button" onClick={() => setBatchTag(t)}
                  className={`h-8 rounded-full px-3 text-[13px] ${batchTag === t ? "bg-[#4A6FA5] text-white" : "bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]"}`} style={{ fontWeight: 500 }}>{t}</button>
              ))}
            </div>
            <ul className="mt-3 max-h-[120px] overflow-y-auto text-[12px] text-[#6B7280]">{pending.map((f) => <li key={f.name} className="truncate">{f.name}</li>)}</ul>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setPending(null)} className="h-10 rounded-lg border border-[#E5E7EB] px-4 text-[14px] text-[#1A2332] hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>Cancel</button>
              <button type="button" onClick={upload} className="h-10 rounded-lg bg-[#4A6FA5] px-4 text-[14px] text-white hover:bg-[#3d5a85]" style={{ fontWeight: 600 }}>Upload</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
