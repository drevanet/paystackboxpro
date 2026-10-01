"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
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

const labels: Record<keyof FaceImages, string> = {
  front: "Front",
  back: "Back",
  left: "Left",
  right: "Right",
  top: "Top",
  bottom: "Bottom",
};

const emptyImages: FaceImages = {
  front: null,
  back: null,
  left: null,
  right: null,
  top: null,
  bottom: null,
};

function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Invalid image result."));
        return;
      }

      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(new Error("Could not read image."));
    };

    reader.readAsDataURL(file);
  });
}

function verifyImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      if (
        image.naturalWidth > 0 &&
        image.naturalHeight > 0
      ) {
        resolve();
      } else {
        reject(
          new Error("Image has no dimensions.")
        );
      }
    };

    image.onerror = () => {
      reject(
        new Error(
          "Browser could not decode the image."
        )
      );
    };

    image.src = src;
  });
}

export function EditorClient({
  initialUser,
}: {
  initialUser: UserInfo;
}) {
  const [images, setImages] =
    useState<FaceImages>(emptyImages);

  const [name, setName] =
    useState("Untitled box");

  const [background, setBackground] =
    useState("#111827");

  const [scale, setScale] =
    useState(1);

  const [projectId, setProjectId] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState("");

  const [uploadingFace, setUploadingFace] =
    useState<keyof FaceImages | null>(null);

  const [saving, setSaving] =
    useState(false);

  const [downloading, setDownloading] =
    useState(false);

  const canvasRef =
    useRef<HTMLDivElement>(null);

  const active =
    initialUser.status === "ACTIVE" ||
    initialUser.status === "NON_RENEWING";

  async function upload(
    face: keyof FaceImages,
    file?: File
  ) {
    if (!file) return;

    setMessage("");

    console.log(
      "SELECTED FILE:",
      file.name,
      file.type,
      file.size
    );

    if (!file.type.startsWith("image/")) {
      setMessage(
        "Please select a valid image."
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage(
        "Each artwork image must be 5MB or smaller."
      );
      return;
    }

    try {
      setUploadingFace(face);

      const dataUrl =
        await readImage(file);

      console.log(
        "DATA URL CREATED:",
        dataUrl.substring(0, 80)
      );

      await verifyImage(dataUrl);

      console.log(
        "IMAGE VERIFIED:",
        face
      );

      setImages((current) => ({
        ...current,
        [face]: dataUrl,
      }));

      setMessage(
        `${labels[face]} artwork uploaded.`
      );
    } catch (error) {
      console.error(
        "UPLOAD ERROR:",
        error
      );

      setMessage(
        `Unable to load ${labels[
          face
        ].toLowerCase()} image.`
      );
    } finally {
      setUploadingFace(null);
    }
  }

  function removeImage(
    face: keyof FaceImages
  ) {
    setImages((current) => ({
      ...current,
      [face]: null,
    }));

    setMessage(
      `${labels[face]} artwork removed.`
    );
  }

  async function save() {
    if (saving) return;

    try {
      setSaving(true);
      setMessage("Saving project...");

      const response = await fetch(
        "/api/projects",
        {
          method: projectId
            ? "PUT"
            : "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            id: projectId,
            name,
            background,
            scale,

            // IMPORTANT:
            // These names must match Prisma/API.

            frontImage: images.front,
            backImage: images.back,
            leftImage: images.left,
            rightImage: images.right,
            topImage: images.top,
            bottomImage: images.bottom,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.error ||
            "Unable to save project."
        );
        return;
      }

      setProjectId(
        data.project.id
      );

      setMessage(
        "Project saved successfully."
      );
    } catch (error) {
      console.error(
        "SAVE ERROR:",
        error
      );

      setMessage(
        "Unable to save project."
      );
    } finally {
      setSaving(false);
    }
  }

  async function download() {
    if (!active) {
      setMessage(
        "An active subscription is required to download."
      );
      return;
    }

    if (downloading) return;

    const canvas =
      canvasRef.current?.querySelector(
        "canvas"
      ) as HTMLCanvasElement | null;

    if (!canvas) {
      setMessage(
        "3D preview is still loading."
      );
      return;
    }

    try {
      setDownloading(true);

      setMessage(
        "Preparing PNG..."
      );

      const png =
        canvas.toDataURL(
          "image/png",
          1
        );

      const response =
        await fetch(
          "/api/downloads",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              projectId,
              png,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.error ||
            "Download failed."
        );
        return;
      }

      const link =
        document.createElement("a");

      link.href = data.png;

      link.download =
        `${
          name
            .replace(
              /[^a-z0-9-_]+/gi,
              "-"
            )
            .toLowerCase() ||
          "box-shot"
        }.png`;

      document.body.appendChild(
        link
      );

      link.click();
      link.remove();

      setMessage(
        "PNG downloaded."
      );
    } catch (error) {
      console.error(
        "DOWNLOAD ERROR:",
        error
      );

      setMessage(
        "Unable to create PNG."
      );
    } finally {
      setDownloading(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-2xl font-black text-white">
            3D Box Shot Editor
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Signed in as{" "}
            {initialUser.email}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300">
          Subscription:{" "}
          <span
            className={
              active
                ? "font-semibold text-emerald-400"
                : "text-slate-400"
            }
          >
            {active
              ? initialUser.planKey ||
                "Active"
              : "Inactive"}
          </span>
        </div>

      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">

        <aside className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">

          <div>
            <label className="text-xs text-slate-400">
              Project name
            </label>

            <input
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value
                )
              }
              className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none focus:border-white/30"
            />
          </div>

          <div>

            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">
                Artwork
              </p>

              <span className="text-xs text-slate-500">
                6 faces
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">

              {faces.map((face) => {
                const image =
                  images[face];

                const loading =
                  uploadingFace ===
                  face;

                return (
                  <div
                    key={face}
                    className="overflow-hidden rounded-lg border border-white/10 bg-slate-900"
                  >

                    <div className="p-3">

                      <div className="mb-3 flex h-24 w-full items-center justify-center overflow-hidden rounded-md bg-white">

                        {image ? (
                          <img
                            src={image}
                            alt={`${labels[face]} artwork`}
                            className="block h-full w-full object-contain"
                          />
                        ) : (
                          <span className="text-xs text-slate-400">
                            No image
                          </span>
                        )}

                      </div>

                      <label className="block cursor-pointer">

                        <span className="block text-sm font-semibold text-white">
                          {labels[face]}
                        </span>

                        <span className="mt-1 block text-xs text-slate-500">
                          {loading
                            ? "Loading..."
                            : image
                            ? "Change image"
                            : "Choose image"}
                        </span>

                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={loading}
                          onChange={(event) => {
                            const file =
                              event.currentTarget.files?.[0];

                            upload(
                              face,
                              file
                            );

                            event.currentTarget.value =
                              "";
                          }}
                        />

                      </label>

                    </div>

                    {image && (
                      <button
                        type="button"
                        onClick={() =>
                          removeImage(
                            face
                          )
                        }
                        className="w-full border-t border-white/10 py-2 text-xs text-red-400 hover:bg-red-500/10"
                      >
                        Remove
                      </button>
                    )}

                  </div>
                );
              })}

            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400">
              Background
            </label>

            <input
              type="color"
              value={background}
              onChange={(event) =>
                setBackground(
                  event.target.value
                )
              }
              className="mt-2 h-10 w-full cursor-pointer rounded-lg"
            />
          </div>

          <div>

            <div className="flex justify-between">
              <label className="text-xs text-slate-400">
                Box scale
              </label>

              <span className="text-xs text-white">
                {scale.toFixed(2)}
              </span>
            </div>

            <input
              type="range"
              min="0.7"
              max="1.3"
              step="0.01"
              value={scale}
              onChange={(event) =>
                setScale(
                  Number(
                    event.target.value
                  )
                )
              }
              className="mt-2 w-full"
            />

          </div>

          <div className="grid grid-cols-2 gap-2">

            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-lg border border-white/10 px-3 py-2 font-semibold text-white hover:bg-white/5 disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : "Save"}
            </button>

            <button
              type="button"
              onClick={download}
              disabled={downloading}
              className="rounded-lg bg-white px-3 py-2 font-semibold text-slate-950 hover:bg-slate-200 disabled:opacity-50"
            >
              {downloading
                ? "Preparing..."
                : "Download PNG"}
            </button>

          </div>

          {!active && (
            <a
              href="/pricing"
              className="block rounded-lg bg-cyan-400 px-3 py-2 text-center font-bold text-slate-950"
            >
              Subscribe to download
            </a>
          )}

          {message && (
            <div className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-400">
              {message}
            </div>
          )}

        </aside>

        <section
          ref={canvasRef}
          className="relative h-[650px] min-h-[650px] overflow-hidden rounded-2xl border border-white/10 bg-slate-900"
        >
          <BoxScene
            images={images}
            scale={scale}
            background={background}
          />
        </section>

      </div>

    </main>
  );
}