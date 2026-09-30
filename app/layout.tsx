import type { Metadata } from "next";
import "./globals.css";
import { Footer } from "../components/Footer";

export const metadata: Metadata = {
  title: "RevaBox Shot Studio",
  description: "Create professional 3D box shots in your browser.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950">
        <div className="min-h-screen">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
