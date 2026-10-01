import Link from "next/link";
import { Header } from "../components/Header";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <section className="mx-auto max-w-6xl px-6 py-24 text-center">
          <div className="mx-auto max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">3D Box Shot Maker</p>
            <h1 className="text-5xl font-black tracking-tight sm:text-7xl">Turn your artwork into a professional 3D box shot.</h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400">
              Upload artwork to every face, rotate your box in real time, choose a background, save projects, and export a PNG.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/editor" className="rounded-xl bg-white px-6 py-3 font-bold text-slate-950">Start creating</Link>
              <Link href="/pricing" className="rounded-xl border border-white/10 px-6 py-3 font-semibold">View plans</Link>
            </div>
          </div>
        </section>
        <section className="mx-auto grid max-w-6xl gap-5 px-6 pb-24 md:grid-cols-3">
          {[
            ["Six-face artwork", "Add separate artwork to front, back, left, right, top and bottom."],
            ["Interactive 3D preview", "Rotate and inspect your box in real time."],
            ["PNG downloads", "Export your finished design directly from the editor."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-lg font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
