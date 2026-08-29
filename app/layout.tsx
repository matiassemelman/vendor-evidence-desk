import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { metadataBase: new URL("https://vendor-evidence-desk.vercel.app"), title: "Vendor Evidence Desk — Governed AI case study", description: "Watch AI ground a supplier record in source evidence, preserve a consequential conflict and stop for an accountable human decision.", openGraph: { title: "AI prepares the evidence. A human owns the decision.", description: "An interactive case study in grounded extraction, deterministic rules and governed approval.", type: "website" }, twitter: { card: "summary_large_image" } };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
