"use client";
import { useState } from "react";
import type { Extraction, Packet } from "@/lib/case";

type Run = {
  extraction: Extraction; route: string; issues: string[]; conflicts: string[]; proof: string;
  meta: { mode: "live" | "replay"; model: string; inputTokens: number; outputTokens: number; latencyMs: number; reason?: string };
};
type Receipt = { record: { recordId: string }; persisted: boolean; exportMode: string; approvedAt: string };
const labels: Record<string, string> = {
  legal_name: "Legal name", tax_id: "Tax ID", registered_address: "Registered address", country: "Country",
  primary_contact_email: "Primary contact", payment_currency: "Currency",
  payment_terms_days: "Payment terms", bank_account_last4: "Bank account",
};

export default function Desk({ packet }: { packet: Packet }) {
  const [run, setRun] = useState<Run>();
  const [selected, setSelected] = useState("4421");
  const [reason, setReason] = useState("The onboarding profile is current; the sample invoice is explicitly stale.");
  const [receipt, setReceipt] = useState<Receipt>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const send = async (body: object) => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/case", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return data;
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Request failed"); }
    finally { setBusy(false); }
  };
  const analyze = async () => {
    const data = await send({ action: "analyze", caseId: packet.caseId });
    if (data) { setRun(data); setReceipt(undefined); }
  };
  const exportCase = async () => {
    if (!run) return;
    const data = await send({ action: "approve", caseId: packet.caseId, proof: run.proof, selected, reason });
    if (data) setReceipt(data);
  };
  const bank = run?.extraction.fields.find((field) => field.name === "bank_account_last4");

  return (
    <main>
      <header>
        <a className="brand" href="#top">VED / 01</a><span>AI-assisted supplier operations</span>
        <span className="synthetic">Synthetic data only</span>
      </header>
      <section className="hero" id="top">
        <div>
          <p className="eyebrow">Vendor onboarding · evidence desk</p>
          <h1>Let AI prepare the case.<br/><em>Keep judgment human.</em></h1>
          <p className="lede">Three supplier documents disagree on a bank account. The system extracts evidence, refuses to hide the conflict, and exports only after a reasoned human decision.</p>
          <button onClick={analyze} disabled={busy}>{busy ? "Running bounded extraction…" : "Run evidence check"}</button>
        </div>
        <aside><p className="aside-title">Authority map</p><ol>
          <li><b>Model</b><span>Proposes fields + excerpts</span></li>
          <li><b>Rules</b><span>Resolve evidence + route</span></li>
          <li><b>Reviewer</b><span>Decides + approves</span></li>
        </ol></aside>
      </section>
      <section className="packet">
        <div className="section-title"><p>01 / Source packet</p><h2>What the model is allowed to see</h2></div>
        <div className="documents">{packet.documents.map((document, index) =>
          <article key={document.id}><span>0{index + 1}</span><h3>{document.title}</h3>
            <p>{document.content.split("\n").slice(0, 3).join(" · ")}</p><small>{document.id}</small>
          </article>
        )}</div>
      </section>
      {run && <section className="workbench">
        <div className="runbar"><div><span className={run.meta.mode}>{run.meta.mode}</span>
          <b>{run.route.replaceAll("_", " ")}</b></div>
          <p>{run.meta.model} · {run.meta.latencyMs} ms · {run.meta.inputTokens + run.meta.outputTokens} tokens</p>
          {run.meta.reason && <small>{run.meta.reason}</small>}
        </div>
        <div className="section-title"><p>02 / Prepared record</p><h2>Eight fields, with receipts</h2></div>
        <div className="fields">{run.extraction.fields.map((field) =>
          <article className={field.candidates.length > 1 ? "conflicted" : ""} key={field.name}>
            <div><span>{labels[field.name]}</span>{field.candidates.length > 1 && <strong>Conflict</strong>}</div>
            <h3>{field.candidates.map((candidate) => candidate.value).join(" / ") || "No grounded value"}</h3>
            <details><summary>{field.candidates.reduce((count, candidate) => count + candidate.evidence.length, 0)} evidence receipt(s)</summary>
              {field.candidates.flatMap((candidate) => candidate.evidence.map((evidence) =>
                <blockquote key={candidate.value + evidence.documentId}>“{evidence.excerpt}”<cite>{evidence.documentId}</cite></blockquote>
              ))}
            </details>
          </article>
        )}</div>
        {bank && <div className="decision">
          <div><p className="eyebrow">03 / Human gate</p><h2>The system will not choose.</h2>
            <p>Both values are grounded. Select the authoritative source and leave an audit reason.</p>
          </div>
          <fieldset><legend>Account ending</legend>
            {bank.candidates.map((candidate) => <label key={candidate.value}>
              <input type="radio" name="bank" value={candidate.value} checked={selected === candidate.value} onChange={(event) => setSelected(event.target.value)}/>
              <b>{candidate.value}</b><span>{candidate.evidence[0].documentId}</span>
            </label>)}
            <label className="reason">Review reason
              <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3}/>
            </label>
            <button onClick={exportCase} disabled={busy || Boolean(receipt)}>Approve exact record → mock export</button>
          </fieldset>
        </div>}
        {receipt && <div className="receipt"><span>04 / External action</span>
          <h2>{receipt.persisted ? "Approved snapshot persisted and exported." : "Preview export completed — database not configured."}</h2>
          <p>{receipt.record.recordId} · {receipt.exportMode} · {new Date(receipt.approvedAt).toLocaleString()}</p>
        </div>}
      </section>}
      {error && <p className="error" role="alert">{error}</p>}
      <footer><p>One case. One model call. One consequential human decision.</p>
        <a href="https://github.com/matiassemelman" rel="noreferrer">Built by Matias Semelman ↗</a>
      </footer>
    </main>
  );
}
