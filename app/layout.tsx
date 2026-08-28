import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Vendor Evidence Desk", description: "Evidence-backed supplier review with an explicit human decision." };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
