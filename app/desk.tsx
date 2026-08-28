"use client";
import { useEffect, useRef, useState } from "react";
import type { Extraction, Packet } from "@/lib/case";

type Run = {
  extraction: Extraction; route: string; issues: string[]; conflicts: string[]; proof: string;
  trace: { source: "live" | "replay"; attempt: "not_attempted" | "completed" | "failed"; latencyMs: number;
    provider?: string; responseId?: string; requestId?: string; model?: string; status?: string;
    usage?: { input: number; output: number; total: number }; reason?: "disabled" | "provider_failure" | "invalid_output";
    documentIds: string[]; proposal: { fields: number; candidates: number; evidence: number }; verifiedFields: number; ruleAddedCandidates: number };
};
type Receipt = { record: { recordId: string }; persisted: boolean; exportMode: string; approvedAt: string };
type Activity = "analyze" | "export";
const labels: Record<string, string> = {
  legal_name: "Legal name", tax_id: "Tax ID", registered_address: "Registered address", country: "Country",
  primary_contact_email: "Primary contact", payment_currency: "Currency",
  payment_terms_days: "Payment terms", bank_account_last4: "Bank account",
};
const stages = ["Sources", "Evidence", "Review", "Export"];
const traceReasons = { disabled: "Live AI disabled · fixture used", provider_failure: "Provider failure · fixture used", invalid_output: "Invalid model output · fixture used" };
const moveTo = (element: HTMLElement | null) => {
  if (!element) return;
  const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  element.scrollIntoView({ behavior, block: "start" });
  element.focus({ preventScroll: true });
};

export default function Desk({ packet }: { packet: Packet }) {
  const [run, setRun] = useState<Run>();
  const [selected, setSelected] = useState("4421");
  const [reason, setReason] = useState("The onboarding profile is current; the sample invoice is explicitly stale.");
  const [receipt, setReceipt] = useState<Receipt>();
  const [activity, setActivity] = useState<Activity>();
  const [error, setError] = useState("");
  const workbenchRef = useRef<HTMLElement>(null);
  const decisionRef = useRef<HTMLDivElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const send = async (body: object, nextActivity: Activity) => {
    setActivity(nextActivity);
    setError("");
    try {
      const response = await fetch("/api/case", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
      return data;
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Request failed"); }
    finally { setActivity(undefined); }
  };
  const analyze = async () => {
    setRun(undefined);
    setReceipt(undefined);
    const data = await send({ action: "analyze", caseId: packet.caseId }, "analyze");
    if (data) setRun(data);
  };
  const exportCase = async () => {
    if (!run) return;
    const data = await send({ action: "approve", caseId: packet.caseId, proof: run.proof, selected, reason }, "export");
    if (data) setReceipt(data);
  };
  const bank = run?.extraction.fields.find((field) => field.name === "bank_account_last4");
  const phase = receipt ? 4 : run ? 3 : activity === "analyze" ? 2 : 1;

  useEffect(() => {
    const target = receipt ? receiptRef.current : activity === "analyze" || error ? workbenchRef.current : null;
    if (!target) return;
    const frame = requestAnimationFrame(() => moveTo(target));
    return () => cancelAnimationFrame(frame);
  }, [activity, error, receipt, run]);

  return (
    <main>
      <header>
        <a className="brand" href="#top">VED / 01</a><span>Evidence operations</span>
        <span className="synthetic">Synthetic data only</span>
      </header>
      <nav className="journey" aria-label="Case progress"><span>Guided case</span><ol>
        {stages.map((stage, index) => <li className={index + 1 < phase ? "done" : index + 1 === phase ? "active" : ""} aria-current={index + 1 === phase ? "step" : undefined} key={stage}>
          <i>0{index + 1}</i><b>{stage}</b>
        </li>)}
      </ol></nav>
      <section className={`hero ${activity || run ? "compact" : ""}`} id="top">
        <div>
          <p className="eyebrow">Vendor onboarding · evidence desk</p>
          <h1>Let AI prepare the case.<br/><em>Keep judgment human.</em></h1>
          <p className="lede">Three supplier documents disagree on a bank account. The system extracts evidence, refuses to hide the conflict, and exports only after a reasoned human decision.</p>
          <button onClick={analyze} disabled={Boolean(activity)}>{activity === "analyze" ? "Preparing evidence…" : "Run evidence check"}</button>
          <small className="action-note">One bounded model call · no autonomous approval</small>
        </div>
        <aside><p className="aside-title">Control boundary</p><ol>
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
      {(activity === "analyze" || run || error) && <section className="workbench" ref={workbenchRef} tabIndex={-1} aria-label="Case workspace">
        {activity === "analyze" && !run && <div className="processing" role="status" aria-live="polite">
          <div><p className="eyebrow">02 / Evidence preparation</p><h2 id="workbench-title">Building a grounded vendor record.</h2>
            <p>The workspace moved with your action. The model can propose; deterministic checks still decide what needs review.</p></div>
          <div className="processing-signal" aria-hidden="true"><span/><span/><span/></div>
          <ol className="trace-lanes pending"><li><b>AI</b><span>One bounded request in flight</span></li>
            <li><b>Rules</b><span>Waiting for model proposal</span></li><li><b>Human</b><span>Not reached</span></li></ol>
        </div>}
        {error && <div className="flow-error" role="alert"><div><p>Workflow interrupted</p><h2>{error}</h2></div>
          <button onClick={run ? exportCase : analyze}>{run ? "Retry export" : "Retry evidence check"}</button></div>}
        {run && <>
        <div className="runtrace">
          <div className="trace-head"><div><span className={run.trace.source}>{run.trace.source === "live" ? "Live model call" : run.trace.attempt === "failed" ? "Live attempt failed · replay" : "Replay fixture"}</span>
            <b>{run.trace.source === "live" ? "completed" : run.trace.attempt === "failed" ? "fallback used" : "no provider call"}</b></div>
            <p>{run.trace.source === "live" ? `${run.trace.model} · ${run.trace.latencyMs} ms · ${run.trace.usage?.input} in / ${run.trace.usage?.output} out` : run.trace.reason && traceReasons[run.trace.reason]}</p></div>
          <ol className="trace-lanes"><li><b>AI</b><span>{run.trace.source === "live" ? `${run.trace.proposal.fields} fields · ${run.trace.proposal.candidates} candidates · ${run.trace.proposal.evidence} excerpts` : `Versioned fixture · ${run.trace.proposal.fields} fields`}</span></li>
            <li><b>Rules</b><span>{run.trace.verifiedFields}/8 verified · {run.conflicts.length} conflict preserved · {run.route.replaceAll("_", " ")}</span></li>
            <li><b>Human</b><span>{run.route === "needs_review" ? "Decision required · bank account" : run.route === "blocked" ? "Approval blocked" : "Ready for approval"}</span></li></ol>
          <details className="inspector"><summary>Inspect this {run.trace.source === "live" ? "AI run" : "replay"}</summary><div>
            <dl><dt>Provider call</dt><dd>{run.trace.provider || "Not called"}</dd><dt>Response status</dt><dd>{run.trace.status || "Replay"}</dd>
              {run.trace.responseId && <><dt>Response ID</dt><dd className="trace-id" title={run.trace.responseId}>{run.trace.responseId}</dd></>}
              {run.trace.requestId && <><dt>Request ID</dt><dd className="trace-id" title={run.trace.requestId}>{run.trace.requestId}</dd></>}</dl>
            <dl><dt>Input boundary</dt><dd>{run.trace.documentIds.join(" · ")}</dd><dt>Proposal delta</dt><dd>{run.trace.ruleAddedCandidates ? `${run.trace.ruleAddedCandidates} candidate recovered by rules` : "No rule-added candidates"}</dd>
              <dt>Verified facts</dt><dd>Structured proposal parsed · evidence inspected · deterministic route recorded</dd></dl>
          </div></details>
        </div>
        <div className="case-summary"><div><p className="eyebrow">Evidence check complete</p>
          <h2 id="workbench-title">Eight grounded fields. One decision is still yours.</h2>
          <p>The system preserved the consequential exception instead of silently choosing a bank account.</p></div>
          <dl><div><dt>Grounded fields</dt><dd>{run.extraction.fields.length}/8</dd></div><div><dt>Exceptions</dt><dd>{run.conflicts.length}</dd></div></dl>
          <button onClick={() => moveTo(decisionRef.current)}>Review the exception ↓</button>
        </div>
        <div className="section-title"><p>02 / Prepared record</p><h2>Every value carries a receipt</h2></div>
        <div className="fields">{run.extraction.fields.map((field) =>
          <article className={run.conflicts.includes(field.name) ? "conflicted" : ""} key={field.name}>
            <div><span>{labels[field.name]}</span>{run.conflicts.includes(field.name) && <strong>Exception</strong>}</div>
            <h3>{field.candidates.map((candidate) => candidate.value).join(" / ") || "No grounded value"}</h3>
            <details><summary>{field.candidates.reduce((count, candidate) => count + candidate.evidence.length, 0)} evidence receipt(s)</summary>
              {field.candidates.flatMap((candidate, candidateIndex) => candidate.evidence.map((evidence, evidenceIndex) =>
                <blockquote key={`${field.name}-${candidateIndex}-${evidenceIndex}`}>“{evidence.excerpt}”<cite>{evidence.documentId}</cite></blockquote>
              ))}
            </details>
          </article>
        )}</div>
        {bank && <div className="decision" ref={decisionRef} tabIndex={-1}>
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
            <button onClick={exportCase} disabled={Boolean(activity) || Boolean(receipt)}>{activity === "export" ? "Exporting approved snapshot…" : "Approve exact record → mock export"}</button>
          </fieldset>
        </div>}
        {receipt && <div className="receipt" ref={receiptRef} tabIndex={-1} role="status"><span>04 / External action</span>
          <h2>{receipt.persisted ? "Approved snapshot persisted and exported." : "Preview export completed — database not configured."}</h2>
          <p>{receipt.record.recordId} · {receipt.exportMode} · {new Date(receipt.approvedAt).toLocaleString()}</p>
        </div>}
        </>}
      </section>}
      <footer><p>One case. One model call. One consequential human decision.</p>
        <a href="https://github.com/matiassemelman/vendor-evidence-desk" rel="noreferrer">Inspect the source ↗</a>
      </footer>
    </main>
  );
}
