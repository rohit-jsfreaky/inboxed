"use client";

import { renderLocal } from "@/lib/render-local";
import NextLink from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, ArrowLeft, Check, Copy01, Download01, FileCheck02, Image01, Mail01, Plus, RefreshCw01, XClose } from "@untitledui/icons";
import { VERDICT_LABEL, toValues, type Level } from "../../templates/_shared/mail.ts";
import { check, fromSnapshot, type Checked } from "@/lib/dns";
import { Mark } from "./Mark";

type Out = "report" | "request" | "card";
const OUTS: Array<{ key: Out; label: string; icon: ReactNode; file: string }> = [
  { key: "report", label: "Client report", icon: <FileCheck02 size={16} />, file: "email-report.pdf" },
  { key: "request", label: "DNS request", icon: <Mail01 size={16} />, file: "dns-request.html" },
  { key: "card", label: "Card", icon: <Image01 size={16} />, file: "email-status.png" },
];
const NAME: Record<string, string> = { mx: "Mail servers", spf: "SPF", dkim: "DKIM", dmarc: "DMARC", mtasts: "MTA-STS", bimi: "BIMI" };
const LEVEL: Record<Level, { label: string; tone: string; dot: string }> = {
  pass: { label: "Pass", tone: "text-pass bg-pass-soft", dot: "bg-pass" },
  warn: { label: "Fix soon", tone: "text-warn bg-warn-soft", dot: "bg-warn" },
  fail: { label: "Fix now", tone: "text-fail bg-fail-soft", dot: "bg-fail" },
  info: { label: "Note", tone: "text-info bg-wash", dot: "bg-rule" },
};
const VERDICT_TONE = { ready: "text-pass border-pass", almost: "text-warn border-warn", "at-risk": "text-fail border-fail" } as const;
const day = (iso: string) => iso.slice(0, 10);

export function Postroom() {
  const [list, setList] = useState<Checked[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [meta, setMeta] = useState({ preparedBy: "", client: "" });
  const [selectors, setSelectors] = useState("");
  const [sheet, setSheet] = useState<Out | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("inboxed:meta") ?? "null");
      if (saved) setTimeout(() => setMeta((m) => ({ ...m, preparedBy: saved.preparedBy ?? "" })), 0);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("inboxed:meta", JSON.stringify({ preparedBy: meta.preparedBy }));
    } catch {}
  }, [meta.preparedBy]);

  async function add(inputs: string[]) {
    setError(null);
    let first = true;
    for (const input of inputs.map((s) => s.trim()).filter(Boolean)) {
      setBusy(input);
      try {
        const c = await check(input, selectors.split(/[\s,]+/));
        // Keep the order people typed; a re-check replaces its row in place.
        setList((l) => (l.some((x) => x.domain === c.domain) ? l.map((x) => (x.domain === c.domain ? c : x)) : [...l, c]));
        if (first) setOpen(c.domain);
        first = false;
      } catch (e) {
        setError((e as Error).message);
      }
    }
    setBusy(null);
  }

  if (!list.length) return <Start busy={busy} error={error} add={add} sample={async () => {
    setBusy("the sample");
    const s = await fromSnapshot();
    setList(s);
    setOpen(s[0].domain);
    setMeta((m) => ({ ...m, preparedBy: m.preparedBy || "Kestrel Web Studio", client: "Revlio" }));
    setBusy(null);
  }} selectors={selectors} setSelectors={setSelectors} />;

  const current = list.find((c) => c.domain === open) ?? list[0];
  const r = current.report;
  const values = toValues(r, { checked: day(current.at), preparedBy: meta.preparedBy, client: meta.client });

  return (
    <div className="min-h-dvh flex flex-col bg-wash">
      <div className="h-2 airmail" aria-hidden="true" />
      <header className="h-14 shrink-0 bg-paper border-b border-line flex items-center gap-3 px-4 md:px-6">
        <NextLink href="/" className="flex items-center gap-2 font-extrabold text-[19px] tracking-tight" aria-label="Inboxed home">
          <Mark /> <span className="max-[400px]:hidden">Inboxed</span>
        </NextLink>
        <div className="flex-1" />
        <div className="flex gap-1.5">
          {OUTS.map((o) => (
            <button key={o.key} className={`btn !py-1.5 max-lg:!px-2.5 ${o.key === "report" ? "btn-teal" : "btn-line"}`} onClick={() => setSheet(o.key)} aria-label={o.label}>
              {o.icon} <span className="hidden lg:inline">{o.label}</span>
            </button>
          ))}
        </div>
        <button className="btn btn-line !py-1.5 max-sm:!px-2.5" onClick={() => (setList([]), setOpen(null))} aria-label="Start over">
          <ArrowLeft size={16} /> <span className="hidden sm:inline">Start over</span>
        </button>
      </header>

      <div className="flex-1 mx-auto w-full max-w-[1280px] px-4 md:px-6 py-6 grid lg:grid-cols-[320px_1fr] gap-6 items-start">
        <aside className="space-y-3 lg:sticky lg:top-6">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void add(String(f.get("d") ?? "").split(/[\s,]+/));
              e.currentTarget.reset();
            }}
          >
            <input name="d" className="input font-mono !text-[13px]" placeholder="another-domain.com" aria-label="Domain to check" />
            <button className="btn btn-teal !px-3" disabled={!!busy} aria-label="Check domain">
              <Plus size={16} />
            </button>
          </form>
          {busy ? <p className="text-[12.5px] text-muted font-mono">Checking {busy}…</p> : null}
          {error ? (
            <p className="flex gap-2 rounded-lg bg-fail-soft px-3 py-2 text-[13px]">
              <AlertTriangle size={15} className="shrink-0 mt-0.5 text-fail" /> {error}
            </p>
          ) : null}
          <ul className="bg-paper border border-line rounded-2xl overflow-hidden">
            {list.map((c) => {
              const on = c.domain === current.domain;
              const lights = c.report.checks.filter((x) => x.id === "spf" || x.id === "dkim" || x.id === "dmarc");
              return (
                <li key={c.domain} className="border-b border-line last:border-0">
                  <button onClick={() => setOpen(c.domain)} className={`w-full text-left px-4 py-3 ${on ? "bg-teal-soft" : "hover:bg-wash"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[13.5px] truncate">{c.domain}</span>
                      <span className={`shrink-0 text-[11px] font-bold border rounded-full px-2 py-0.5 ${VERDICT_TONE[c.report.verdict]}`}>{VERDICT_LABEL[c.report.verdict]}</span>
                    </div>
                    <div className="mt-2 flex gap-3">
                      {lights.map((x) => (
                        <span key={x.id} className="flex items-center gap-1.5 text-[12px] text-muted">
                          <span className={`size-2 rounded-full ${LEVEL[x.level].dot}`} /> {NAME[x.id]}
                        </span>
                      ))}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="bg-paper border border-line rounded-2xl p-4 space-y-2.5">
            <p className="tag">On the report</p>
            <Field label="Prepared by" value={meta.preparedBy} onChange={(v) => setMeta({ ...meta, preparedBy: v })} placeholder="Your studio or name" />
            <Field label="Prepared for" value={meta.client} onChange={(v) => setMeta({ ...meta, client: v })} placeholder="Client" />
          </div>
        </aside>

        <main className="min-w-0 space-y-4">
          <section className="bg-paper border border-line rounded-2xl p-5 md:p-6 flex flex-wrap items-center gap-x-6 gap-y-4">
            <div className="min-w-0 flex-1">
              <p className="tag">{r.sending ? `Sends email${r.provider ? ` · ${r.provider}` : ""}` : "Doesn't send email"} · checked {day(current.at)}</p>
              <h1 className="mt-1 font-mono text-[26px] md:text-[32px] leading-tight break-all">{r.domain}</h1>
              <button className="mt-2 inline-flex items-center gap-1.5 text-[13px] text-teal font-semibold hover:underline" onClick={() => void add([r.domain])} disabled={!!busy}>
                <RefreshCw01 size={14} /> Check again
              </button>
            </div>
            <div className={`grid place-items-center size-[110px] rounded-full border-[3px] ${VERDICT_TONE[r.verdict]}`}>
              <div className="text-center">
                <p className="font-mono text-[10px] tracking-widest">INBOXED</p>
                <p className="font-extrabold text-[18px] leading-tight">{VERDICT_LABEL[r.verdict]}</p>
              </div>
            </div>
          </section>

          {r.sending ? (
            <section className="grid sm:grid-cols-2 gap-3">
              <Rule met={r.gmailAll} title="Gmail, all senders" need="SPF or DKIM" />
              <Rule met={r.gmailBulk} title="Gmail, 5,000+ messages a day" need="SPF, DKIM and DMARC" />
            </section>
          ) : (
            <p className="bg-paper border border-line rounded-2xl p-5 text-[14.5px] text-ink-2">
              <span className="font-bold text-ink">This domain doesn&apos;t send email, but it still needs records</span>, or anyone can send mail that claims to be from it. The records below follow GOV.UK&apos;s guidance for domains that do not send email.
            </p>
          )}

          <section className="bg-paper border border-line rounded-2xl overflow-hidden">
            {r.checks.map((c) => (
              <div key={c.id} className="grid grid-cols-[96px_1fr] sm:grid-cols-[130px_1fr] gap-4 px-5 py-4 border-b border-line last:border-0">
                <div>
                  <p className="font-bold text-[14px]">{NAME[c.id]}</p>
                  <span className={`mt-1 inline-block text-[11.5px] font-bold rounded-full px-2 py-0.5 ${LEVEL[c.level].tone}`}>{LEVEL[c.level].label}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-[15px]">{c.title}</p>
                  <p className="text-[14px] text-ink-2 leading-relaxed">{c.detail}</p>
                  {c.value ? <p className="mt-1 font-mono text-[12px] text-muted break-all">{c.value.length > 260 ? `${c.value.slice(0, 259)}…` : c.value}</p> : null}
                </div>
              </div>
            ))}
          </section>

          {r.fixes.length ? (
            <section className="bg-paper border border-line rounded-2xl p-5 md:p-6">
              <p className="font-extrabold text-[19px]">Records to add</p>
              <p className="text-[13.5px] text-muted">At the domain&apos;s DNS host. If a record with the same host exists, replace it.</p>
              <div className="mt-4 space-y-3">
                {r.fixes.map((f, i) => (
                  <Record key={i} type={f.type} host={f.host} value={f.value} why={f.why} />
                ))}
              </div>
            </section>
          ) : (
            <p className="bg-pass-soft text-pass rounded-2xl p-5 font-semibold">Nothing to add: every check that matters passes.</p>
          )}

          <details className="bg-paper border border-line rounded-2xl p-5">
            <summary className="cursor-pointer text-[14px] font-semibold">Provider uses another DKIM selector?</summary>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void add([r.domain]);
              }}
            >
              <input className="input font-mono !text-[13px]" placeholder="selector names, e.g. 20230601, mxvault" value={selectors} onChange={(e) => setSelectors(e.target.value)} aria-label="Extra DKIM selectors" />
              <button className="btn btn-teal">Check again</button>
            </form>
          </details>
        </main>
      </div>

      {sheet ? <Sheet out={sheet} setOut={setSheet} values={values} onClose={() => setSheet(null)} /> : null}
    </div>
  );
}

/* ---------- start ---------- */

function Start({ busy, error, add, sample, selectors, setSelectors }: { busy: string | null; error: string | null; add: (d: string[]) => void; sample: () => void; selectors: string; setSelectors: (s: string) => void }) {
  const [text, setText] = useState("");
  return (
    <div className="min-h-dvh grid place-items-center p-4 md:p-8 bg-wash">
      <div className="w-full max-w-[620px] bg-paper border border-line rounded-3xl overflow-hidden shadow-[0_30px_60px_-34px_rgb(14_74_82/0.4)]">
        <div className="h-2.5 airmail" aria-hidden="true" />
        <div className="p-6 md:p-8">
          <NextLink href="/" className="flex items-center gap-2 font-extrabold text-[19px]">
            <Mark /> Inboxed
          </NextLink>
          <h1 className="mt-6 font-extrabold text-[32px] md:text-[38px] leading-[1.06] tracking-tight">Which domains are we checking?</h1>
          <p className="mt-2 text-[15px] text-muted leading-relaxed">One or more, one per line. Inboxed reads their public DNS from your browser and checks SPF, DKIM and DMARC against Gmail&apos;s sender rules.</p>
          <form
            className="mt-6 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              add(text.split(/[\s,]+/));
            }}
          >
            <textarea className="input font-mono !text-[14px] h-28 resize-none" placeholder={"yourclient.com\nanother.co.uk"} value={text} onChange={(e) => setText(e.target.value)} aria-label="Domains" />
            <details>
              <summary className="cursor-pointer text-[13px] font-semibold text-ink-2">+ Extra DKIM selectors</summary>
              <input className="input mt-2 font-mono !text-[13px]" placeholder="e.g. 20230601, mxvault" value={selectors} onChange={(e) => setSelectors(e.target.value)} aria-label="Extra DKIM selectors" />
            </details>
            <button className="btn btn-teal w-full justify-center !py-3" disabled={!!busy || !text.trim()}>
              Check {text.split(/[\s,]+/).filter(Boolean).length > 1 ? "domains" : "domain"}
            </button>
          </form>
          <button onClick={sample} className="mt-4 w-full text-left border border-line hover:border-teal rounded-2xl p-4 transition-colors">
            <span className="block font-bold">Sample: two real domains, 20 Nov 2026</span>
            <span className="block text-[13px] text-muted">getrevlio.com (sends email) and provryn.pro (doesn&apos;t), as their DNS answered that day.</span>
          </button>
          {busy ? <p className="mt-4 text-[13px] text-muted font-mono">Checking {busy}…</p> : null}
          {error ? (
            <p className="mt-4 text-[13px] text-fail flex gap-2">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" /> {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ---------- pieces ---------- */

function Rule({ met, title, need }: { met: boolean; title: string; need: string }) {
  return (
    <div className={`bg-paper border-2 rounded-2xl p-4 ${met ? "border-pass" : "border-fail"}`}>
      <p className={`font-mono text-[11.5px] ${met ? "text-pass" : "text-fail"}`}>{met ? "MET" : "NOT MET"}</p>
      <p className="font-bold text-[16px]">{title}</p>
      <p className="text-[13px] text-muted">{need}</p>
    </div>
  );
}

function Record({ type, host, value, why }: { type: string; host: string; value: string; why: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="border border-line rounded-xl p-4 bg-wash">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="tag !text-teal">{type}</span>
        <span className="font-mono text-[13px]">host: {host}</span>
      </div>
      <div className="mt-2 flex items-start gap-2">
        <code className="flex-1 min-w-0 font-mono text-[13.5px] text-teal break-all bg-paper border border-line rounded-lg px-3 py-2">{value}</code>
        <button
          className="btn btn-line !px-3 !py-2"
          onClick={() => {
            void navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          aria-label={`Copy ${host} value`}
        >
          {copied ? <Check size={15} /> : <Copy01 size={15} />}
        </button>
      </div>
      <p className="mt-2 text-[13px] text-ink-2">{why}</p>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-[12px] font-semibold text-ink-2">{label}</span>
      <input className="input mt-1 !py-1.5 !text-[13.5px]" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Sheet({ out, setOut, values, onClose }: { out: Out; setOut: (o: Out) => void; values: ReturnType<typeof toValues>; onClose: () => void }) {
  const [view, setView] = useState<{ url?: string; html?: string; issues?: string[] } | null>(null);
  const key = JSON.stringify(values);
  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      const res = await renderLocal({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ output: out, values }) });
      const type = res.headers.get("Content-Type") ?? "";
      const next = type.includes("json")
        ? await res.json().then((j) => (res.ok ? { html: j.html as string } : { issues: (j.diagnostics ?? [{ message: j.error }]).map((d: { message: string; path?: string }) => `${d.path ? `${d.path.replace(/^values\./, "")}: ` : ""}${d.message}`) }))
        : { url: URL.createObjectURL(await res.blob()) };
      if (!alive) return;
      setView((prev) => {
        if (prev?.url) URL.revokeObjectURL(prev.url);
        return next;
      });
    }, 150);
    return () => {
      alive = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [out, key]);

  async function download() {
    const res = await renderLocal({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ output: out, values }) });
    if (!res.ok) return;
    const a = document.createElement("a");
    a.href = out === "request" ? URL.createObjectURL(new Blob([(await res.json()).html], { type: "text/html" })) : URL.createObjectURL(await res.blob());
    a.download = `${values.domain}-${OUTS.find((o) => o.key === out)!.file}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-teal/30" onClick={onClose}>
      <div className="w-full md:w-[min(1040px,94vw)] h-full bg-paper flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="h-14 shrink-0 border-b border-line flex items-center gap-1 sm:gap-2 px-3 sm:px-5">
          {OUTS.map((o) => (
            <button key={o.key} onClick={() => o.key !== out && (setOut(o.key), setView(null))} className={`px-3 py-1.5 rounded-full text-[13.5px] font-semibold ${out === o.key ? "bg-teal text-white" : "text-muted hover:text-ink"}`}>
              {o.label}
            </button>
          ))}
          <div className="flex-1" />
          <button className="btn btn-teal" onClick={() => void download()} aria-label="Download">
            <Download01 size={16} /> <span className="hidden sm:inline">Download</span>
          </button>
          <button className="text-muted hover:text-ink ml-1" onClick={onClose} aria-label="Close">
            <XClose size={20} />
          </button>
        </div>
        <div className="flex-1 min-h-0 bg-wash flex">
          {view?.issues ? (
            <div className="m-6 rounded-xl bg-fail-soft p-4 space-y-1 self-start">
              <p className="font-bold text-fail text-[14px]">The template refused these values</p>
              {view.issues.map((m) => (
                <p key={m} className="text-[13px]">
                  {m}
                </p>
              ))}
            </div>
          ) : view?.url && out === "report" ? (
            <iframe title="Client report" src={view.url} className="flex-1" />
          ) : view?.url ? (
            <div className="flex-1 grid place-items-center p-6 overflow-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={view.url} alt="Email status card" className="max-w-full border border-line rounded-lg shadow-lg" />
            </div>
          ) : view?.html ? (
            <iframe title="DNS request" srcDoc={view.html} className="flex-1 bg-white" />
          ) : (
            <p className="m-auto text-[14px] text-muted">Rendering with Hyper Elements…</p>
          )}
        </div>
      </div>
    </div>
  );
}
