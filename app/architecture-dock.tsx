"use client";
import { useEffect, useRef, useState } from "react";

export default function ArchitectureDock({ completed, busy }: { completed: boolean; busy: boolean }) {
  const [expanded, setExpanded] = useState(false), [open, setOpen] = useState(false), [mounted, setMounted] = useState(false), [contextual, setContextual] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!completed || sessionStorage.getItem("ved-atlas-after-run")) return;
    sessionStorage.setItem("ved-atlas-after-run", "1");
    const reveal = setTimeout(() => { setContextual(true); setExpanded(false); }); return () => clearTimeout(reveal);
  }, [completed]);
  useEffect(() => { if (!busy) return; const hide = setTimeout(() => setExpanded(false)); return () => clearTimeout(hide); }, [busy]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); requestAnimationFrame(() => trigger.current?.focus()); } };
    addEventListener("keydown", escape); return () => { document.body.style.overflow = ""; removeEventListener("keydown", escape); };
  }, [open]);
  const show = () => { setMounted(true); setOpen(true); setExpanded(false); requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(".atlas-layer nav button")?.focus()); };
  const hide = () => { setOpen(false); requestAnimationFrame(() => trigger.current?.focus()); };
  const minimize = () => setExpanded(false);
  return <>
    <aside className={`atlas-dock ${expanded ? "expanded" : ""}`} aria-label="Architecture walkthrough">
      <button ref={trigger} onClick={show} aria-expanded={open}><b>{contextual ? "Run Atlas" : "System Atlas"}</b>{expanded && <span>{contextual ? "You just saw this architecture run." : "See how AI, rules and human review divide authority."}<em>Explore architecture · 3 min →</em></span>}</button>
      {expanded && <button className="dock-minimize" onClick={minimize} aria-label="Minimize architecture invitation">×</button>}
    </aside>
    {mounted && <section className="atlas-layer" hidden={!open} role="dialog" aria-modal="true" aria-label="System Atlas architecture walkthrough">
      <nav><b>VED / SYSTEM ATLAS</b><span>Interactive architecture walkthrough</span><a href="/architecture" target="_blank">Open in new tab ↗</a><button onClick={hide}>Close ×</button></nav>
      <iframe src="/architecture" title="Vendor Evidence Desk System Atlas" />
    </section>}
  </>;
}
