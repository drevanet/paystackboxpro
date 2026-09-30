"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef, useState } from "react";
import type { FaceImages } from "./BoxScene";

const BoxScene = dynamic(() => import("./BoxScene"), { ssr: false });

type UserInfo = { name: string; email: string; planKey: string | null; status: string };

const faces: (keyof FaceImages)[] = ["front", "back", "left", "right", "top", "bottom"];

export function EditorClient({ initialUser }: { initialUser: UserInfo }) {
  const [images, setImages] = useState<FaceImages>({ front: null, back: null, left: null, right: null, top: null, bottom: null });
  const [name, setName] = useState("Untitled box");
  const [background, setBackground] = useState("#111827");
  const [scale, setScale] = useState(1);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const canvasRef = useRef<HTMLDivElement>(null);

  const active = initialUser.status === "ACTIVE" || initialUser.status === "NON_RENEWING";

  const faceLabels = useMemo(() => ({
    front: "Front", back: "Back", left: "Left", right: "Right", top: "Top", bottom: "Bottom"
  }), []);

  function upload(face: keyof FaceImages, file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setMessage("Please select an image file.");
    if (file.size > 5 * 1024 * 1024) return setMessage("Each artwork image must be 5MB or smaller.");
    const reader = new FileReader();
    reader.onload = () => setImages(v => ({ ...v, [face]: String(reader.result) }));
    reader.readAsDataURL(file);
  }

  async function save() {
    setMessage("Saving…");
    const res = await fetch("/api/projects", {
      method: projectId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: projectId, name, background, scale, ...images }),
    });
    const data = await res.json();
    if (!res.ok) return setMessage(data.error || "Unable to save.");
    setProjectId(data.project.id);
    setMessage("Project saved.");
  }

  async function download() {
    if (!active) return setMessage("An active subscription is required to download.");
    const canvas = canvasRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) return setMessage("Preview is still loading.");
    setMessage("Preparing PNG…");
    const png = canvas.toDataURL("image/png", 1);
    const res = await fetch("/api/downloads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId, png }) });
    const data = await res.json();
    if (!res.ok) return setMessage(data.error || "Download failed.");
    const a = document.createElement("a");
    a.href = data.png;
    a.download = `${name.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase() || "box-shot"}.png`;
    a.click();
    setMessage("PNG downloaded.");
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-black">3D Box Shot Editor</h1><p className="text-sm text-slate-400">Signed in as {initialUser.email}</p></div>
        <div className="rounded-xl border border-white/10 px-4 py-2 text-sm">
          Subscription: <span className={active ? "font-semibold text-emerald-400" : "text-slate-400"}>{active ? (initialUser.planKey || "Active") : "Inactive"}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div>
            <label className="text-xs text-slate-400">Project name</label>
            <input value={name} onChange={e=>setName(e.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2" />
          </div>

          <div>
            <p className="text-sm font-semibold">Artwork</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {faces.map(face => (
                <label key={face} className="cursor-pointer rounded-lg border border-white/10 bg-slate-900 p-3 text-xs hover:bg-white/5">
                  <span className="block font-medium">{faceLabels[face]}</span>
                  <span className="mt-1 block text-slate-500">{images[face] ? "Uploaded" : "Choose image"}</span>
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={e=>upload(face, e.target.files?.[0])} />
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400">Background</label>
            <input type="color" value={background} onChange={e=>setBackground(e.target.value)} className="mt-2 h-10 w-full cursor-pointer rounded-lg bg-slate-900" />
          </div>

          <div>
            <label className="text-xs text-slate-400">Box scale: {scale.toFixed(2)}</label>
            <input type="range" min="0.7" max="1.3" step="0.01" value={scale} onChange={e=>setScale(Number(e.target.value))} className="mt-2 w-full" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={save} className="rounded-lg border border-white/10 px-3 py-2 font-semibold hover:bg-white/5">Save</button>
            <button onClick={download} className="rounded-lg bg-white px-3 py-2 font-semibold text-slate-950">Download PNG</button>
          </div>

          {!active && (
            <a href="/pricing" className="block rounded-lg bg-cyan-400 px-3 py-2 text-center font-bold text-slate-950">Subscribe to download</a>
          )}
          {message && <p className="text-sm text-slate-400">{message}</p>}
        </aside>

        <section className="min-h-[650px] overflow-hidden rounded-2xl border border-white/10 bg-slate-900" ref={canvasRef}>
          <BoxScene images={images} scale={scale} />
        </section>
      </div>
    </main>
  );
}
