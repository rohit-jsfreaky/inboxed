// DNS from the browser, over HTTPS: dns.google first, Cloudflare if it fails. Both allow cross-origin requests.
import { analyse, cleanDomain, gather, type Answers, type Report, type Resolve } from "../../templates/_shared/mail.ts";

const TYPE = { MX: 15, TXT: 16 } as const;

async function ask(url: string, type: "MX" | "TXT", headers?: HeadersInit) {
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`DNS answered ${r.status}`);
  const j = await r.json();
  return ((j.Answer ?? []) as Array<{ type: number; data: string }>).filter((a) => a.type === TYPE[type]).map((a) => a.data);
}

export const resolve: Resolve = async (name, type) => {
  const q = `name=${encodeURIComponent(name)}&type=${type}`;
  try {
    return await ask(`https://dns.google/resolve?${q}`, type);
  } catch {
    return ask(`https://cloudflare-dns.com/dns-query?${q}`, type, { accept: "application/dns-json" });
  }
};

export type Checked = { domain: string; answers: Answers; report: Report; at: string };

export async function check(input: string, selectors: string[] = []): Promise<Checked> {
  const domain = cleanDomain(input);
  const answers = await gather(domain, resolve, selectors);
  return { domain, answers, report: analyse(domain, answers), at: new Date().toISOString() };
}

export const SNAPSHOT = "/samples/domains-2026-11-20.json";
/** Two real domains as their DNS answered on 20 Nov 2026. */
export async function fromSnapshot(): Promise<Checked[]> {
  const s = await fetch(SNAPSHOT).then((r) => r.json());
  return Object.entries(s.answers as Record<string, Answers>).map(([domain, answers]) => ({ domain, answers, report: analyse(domain, answers), at: `${s.read}T00:00:00Z` }));
}
