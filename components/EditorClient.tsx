"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef, useState } from "react";
import type { FaceImages } from "./BoxScene";

const BoxScene = dynamic(() => import("./BoxScene"), {
  ssr: false,
});

type UserInfo = {
  name: string;
  email: string;
  planKey: string | null;
  status: string;
};

const faces: (keyof FaceImages)[] = [
  "front",
  "back",
  "left",
  "right",
  "top",
  "bottom",
];

export function EditorClient({
  initialUser,
}: {
  initialUser: UserInfo;
}) {
  const [images, setImages] = useState<FaceImages>({
    front: null,
    back: null,
    left: null,
    right: null,
    top: null,
    bottom: null,
  });

  const [name, setName] = useState("Untitled box");
  const [background, setBackground] = useState("#111827");
  const [scale, setScale] = useState(1);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [uploadingFace, setUploadingFace] =
    useState<keyof FaceImages | null>(null);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  const active =
    initialUser.status === "ACTIVE" ||
    initialUser.status === "NON_RENEWING";

  const faceLabels = useMemo(
    () => ({
      front: "Front",
      back: "Back",
      left: "Left",
      right: "Right",
      top: "Top",
      bottom: "Bottom",
    }),
    []
  );

  function upload(face: keyof FaceImages, file?: File) {
    if (!file) return;

    setMessage("");
    setUploadingFace(face);

    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file.");
      setUploadingFace(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Each artwork image must be 5MB or smaller.");
      setUploadingFace(null);
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        setMessage("Unable to read this image.");
        setUploadingFace(null);
        return;
      }

      setImages((current) => ({
        ...current,
        [face]: result,
      }));

      setMessage(`${faceLabels[face]} artwork uploaded.`);
      setUploadingFace(null);
    };

    reader.onerror = () => {
      setMessage("Unable to read the selected image.");
      setUploadingFace(null);
    };

    reader.readAsDataURL(file);
  }

  function removeImage(face: keyof FaceImages) {
    setImages((current) => ({
      ...current,
      [face]: null,
    }));

    setMessage(`${faceLabels[face]} artwork removed.`);
  }

  async function save() {
    if (saving) return;

    setSaving(true);
    setMessage("Saving…");

    try {
      const response = await fetch("/api/projects", {
        method: projectId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: projectId,
          name,
          background,
          scale,
          front: images.front,
          back: images.back,
          left: images.left,
          right: images.right,
          top: images.top,
          bottom: images.bottom,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Unable to save.");
        return;
      }

      setProjectId(data.project.id);
      setMessage("Project saved successfully.");
    } catch (error) {
      console.error(error);
      setMessage("Unable to save the project.");
    } finally {
      setSaving(false);
    }
  }

  async function download() {
    if (downloading) return;

    if (!active) {
      setMessage(
        "An active subscription is required to download."
      );
      return;
    }

    const canvas = canvasRef.current?.querySelector(
      "canvas"
    ) as HTMLCanvasElement | null;

    if (!canvas) {
      setMessage("Preview is still loading.");
      return;
    }

    setDownloading(true);
    setMessage("Preparing PNG…");

    try {
      /*
       * Make sure the latest WebGL frame is rendered
       * before capturing the canvas.
       */
      const glCanvas = canvas;

      glCanvas.toDataURL("image/png", 1);

      const png = glCanvas.toDataURL(
        "image/png",
        1
      );

      const response = await fetch("/api/downloads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          png,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Download failed.");
        return;
      }

      if (!data.png) {
        setMessage("The server did not return a PNG.");
        return;
      }

      const link = document.createElement("a");

      link.href = data.png;
      link.download =
        `${
          name
            .replace(/[^a-z0-9-_]+/gi, "-")
            .replace(/^-+|-+$/g, "")
            .toLowerCase() || "box-shot"
        }.png`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      setMessage("PNG downloaded successfully.");
    } catch (error) {
      console.error(error);
      setMessage("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white sm:text-3xl">
            3D Box Shot Editor
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Signed in as {initialUser.email}
          </p>
        </div>

        {/* Subscription status */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
          <span className="text-slate-400">
            Subscription:
          </span>{" "}
          <span
            className={
              active
                ? "font-semibold text-emerald-400"
                : "font-semibold text-slate-400"
            }
          >
            {active
              ? initialUser.planKey || "Active"
              : "Inactive"}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Sidebar */}
        <aside className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          {/* Project name */}
          <div>
            <label
              htmlFor="project-name"
              className="text-xs font-medium text-slate-400"
            >
              Project name
            </label>

            <input
              id="project-name"
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Untitled box"
              className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50"
            />
          </div>

          {/* Artwork */}
          <div>
            <p className="text-sm font-semibold text-white">
              Artwork
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Upload artwork for each box face.
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {faces.map((face) => {
                const uploaded = Boolean(images[face]);
                const uploading =
                  uploadingFace === face;

                return (
                  <div
                    key={face}
                    className="relative overflow-hidden rounded-lg border border-white/10 bg-slate-900"
                  >
                    <label className="block cursor-pointer p-3 transition hover:bg-white/5">
                      <span className="block text-xs font-semibold text-white">
                        {faceLabels[face]}
                      </span>

                      <span
                        className={`mt-1 block text-[11px] ${
                          uploaded
                            ? "text-emerald-400"
                            : "text-slate-500"
                        }`}
                      >
                        {uploading
                          ? "Uploading..."
                          : uploaded
                          ? "Artwork uploaded"
                          : "Choose image"}
                      </span>

                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        disabled={uploading}
                        onChange={(event) => {
                          upload(
                            face,
                            event.target.files?.[0]
                          );

                          /*
                           * Reset input so selecting the
                           * same file again triggers onChange.
                           */
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>

                    {uploaded && (
                      <button
                        type="button"
                        onClick={() =>
                          removeImage(face)
                        }
                        className="absolute right-1.5 top-1.5 rounded-md bg-black/70 px-2 py-1 text-[10px] font-semibold text-white transition hover:bg-red-500"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="mt-3 text-[11px] leading-5 text-slate-500">
              PNG, JPG or WebP. Maximum 5MB per face.
            </p>
          </div>

          {/* Background */}
          <div>
            <label
              htmlFor="background"
              className="text-xs font-medium text-slate-400"
            >
              Background
            </label>

            <input
              id="background"
              type="color"
              value={background}
              onChange={(event) =>
                setBackground(event.target.value)
              }
              className="mt-2 h-10 w-full cursor-pointer rounded-lg border border-white/10 bg-slate-900 p-1"
            />
          </div>

          {/* Scale */}
          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="scale"
                className="text-xs font-medium text-slate-400"
              >
                Box scale
              </label>

              <span className="text-xs font-semibold text-cyan-400">
                {scale.toFixed(2)}
              </span>
            </div>

            <input
              id="scale"
              type="range"
              min="0.7"
              max="1.3"
              step="0.01"
              value={scale}
              onChange={(event) =>
                setScale(Number(event.target.value))
              }
              className="mt-3 w-full"
            />
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-lg border border-white/10 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>

            <button
              type="button"
              onClick={download}
              disabled={downloading}
              className="rounded-lg bg-white px-3 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {downloading
                ? "Preparing..."
                : "Download PNG"}
            </button>
          </div>

          {/* Subscribe */}
          {!active && (
            <a
              href="/pricing"
              className="block rounded-lg bg-cyan-400 px-3 py-2.5 text-center text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              Subscribe to download
            </a>
          )}

          {/* Status message */}
          {message && (
            <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
              <p className="text-xs leading-5 text-slate-400">
                {message}
              </p>
            </div>
          )}
        </aside>

        {/* 3D Preview */}
        <section
          ref={canvasRef}
          className="relative min-h-[600px] overflow-hidden rounded-2xl border border-white/10 bg-slate-900 sm:min-h-[650px]"
        >
          <BoxScene
            images={images}
            scale={scale}
          />

          {/* Preview label */}
          <div className="pointer-events-none absolute left-4 top-4 rounded-lg border border-white/10 bg-black/30 px-3 py-2 backdrop-blur">
            <p className="text-xs font-medium text-slate-300">
              3D Preview
            </p>
          </div>

          {/* Upload status */}
          {uploadingFace && (
            <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg border border-white/10 bg-black/70 px-4 py-2 text-xs text-white backdrop-blur">
              Loading{" "}
              {faceLabels[uploadingFace].toLowerCase()} artwork...
            </div>
          )}
        </section>
      </div>
    </main>
  );
}