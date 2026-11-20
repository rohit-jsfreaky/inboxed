/**
 * Inboxed's core, with no imports so the browser, the server and the templates share it: gather a domain's email
 * DNS records (through any resolver), check them against Gmail's sender rules and GOV.UK's guidance for domains that
 * don't send, and write the records to add.
 */

export type Resolve = (name: string, type: "MX" | "TXT") => Promise<string[]>;
export type Answers = {
  mx: string[];
  txt: string[];
  dmarc: string[];
  dkim: Record<string, string[]>; // selector → TXT values found
  spf: Record<string, string[]>; // every SPF include/redirect followed → its TXT values
  mtasts: string[];
  bimi: string[];
};
export type Level = "pass" | "warn" | "fail" | "info";
export type CheckId = "mx" | "spf" | "dkim" | "dmarc" | "mtasts" | "bimi";
export type Check = { id: CheckId; level: Level; title: string; detail: string; value?: string };
export type Fix = { type: "TXT" | "MX"; host: string; value: string; why: string };
export type Report = {
  domain: string;
  provider?: string;
  sending: boolean;
  checks: Check[];
  fixes: Fix[];
  gmailAll: boolean; // "All senders: SPF or DKIM"
  gmailBulk: boolean; // "Bulk senders: SPF, DKIM, and DMARC"
  verdict: "ready" | "almost" | "at-risk";
};

/** Common DKIM selectors: providers' defaults. Others can be added by hand. */
export const SELECTORS = ["google", "selector1", "selector2", "k1", "k2", "s1", "s2", "resend", "mandrill", "mte1", "pm", "fm1", "fm2", "protonmail", "zmail", "default", "dkim", "mail", "smtp", "everlytickey1", "hs1", "cm"];

type Provider = { name: string; match: RegExp; include?: string; selectors: string[] };
const PROVIDERS: Provider[] = [
  { name: "Google Workspace", match: /(^|\.)(google|googlemail)\.com\.?$/i, include: "_spf.google.com", selectors: ["google"] },
  { name: "Microsoft 365", match: /\.mail\.protection\.outlook\.com\.?$/i, include: "spf.protection.outlook.com", selectors: ["selector1", "selector2"] },
  { name: "Fastmail", match: /\.messagingengine\.com\.?$/i, include: "spf.messagingengine.com", selectors: ["fm1", "fm2", "fm3"] },
  { name: "Proton Mail", match: /\.protonmail\.ch\.?$/i, include: "_spf.protonmail.ch", selectors: ["protonmail", "protonmail2", "protonmail3"] },
  { name: "Zoho Mail", match: /\.zoho\.(com|eu|in)\.?$/i, include: "zohomail.com", selectors: ["zmail"] },
];

const unquote = (s: string) => s.replace(/^"|"$/g, "").replace(/"\s*"/g, "");
const isSpf = (s: string) => /^v=spf1(\s|$)/i.test(unquote(s));
const mxHost = (s: string) => s.trim().split(/\s+/).pop()!.toLowerCase();

/** Every lookup a check needs. SPF includes and redirects are followed, up to 12 deep. */
export async function gather(domain: string, resolve: Resolve, extraSelectors: string[] = []): Promise<Answers> {
  const [mx, txt, dmarc, mtasts, bimi] = await Promise.all([resolve(domain, "MX"), resolve(domain, "TXT"), resolve(`_dmarc.${domain}`, "TXT"), resolve(`_mta-sts.${domain}`, "TXT"), resolve(`default._bimi.${domain}`, "TXT")]);
  const selectors = [...new Set([...extraSelectors.map((s) => s.trim()).filter(Boolean), ...SELECTORS])];
  const found = await Promise.all(selectors.map(async (s) => [s, await resolve(`${s}._domainkey.${domain}`, "TXT")] as const));
  const dkim = Object.fromEntries(found.filter(([, v]) => v.length));
  const spf: Record<string, string[]> = {};
  const queue = txt.filter(isSpf).flatMap(targets);
  while (queue.length && Object.keys(spf).length < 12) {
    const name = queue.shift()!;
    if (name in spf) continue;
    spf[name] = (await resolve(name, "TXT")).filter(isSpf);
    queue.push(...spf[name].flatMap(targets));
  }
  return { mx, txt, dmarc: dmarc.map(unquote), dkim, spf, mtasts: mtasts.map(unquote), bimi: bimi.map(unquote) };
}

/** include: and redirect= targets of an SPF record. */
function targets(record: string) {
  return [...unquote(record).matchAll(/(?:^|\s)(?:[+?~-]?include:|redirect=)(\S+)/gi)].map((m) => m[1].toLowerCase());
}

/** DNS-querying mechanisms in an SPF record (RFC 7208 §4.6.4 caps them at 10 in total). */
function lookups(record: string) {
  return [...unquote(record).matchAll(/(?:^|\s)[+?~-]?(include:|a(?=[:/\s]|$)|mx(?=[:/\s]|$)|ptr|exists:|redirect=)/gi)].length;
}

function totalLookups(record: string, spf: Answers["spf"], seen = new Set<string>()): number {
  let n = lookups(record);
  for (const t of targets(record)) {
    if (seen.has(t)) continue;
    seen.add(t);
    for (const r of spf[t] ?? []) n += totalLookups(r, spf, seen);
  }
  return n;
}

/** DKIM public key size from the base64 length of p= (RSA). */
const keyBits = (record: string) => {
  const p = unquote(record).match(/(?:^|;)\s*p=([A-Za-z0-9+/=]*)/)?.[1] ?? "";
  if (!p) return 0;
  const bytes = (p.replace(/=+$/, "").length * 3) / 4;
  return bytes > 400 ? 4096 : bytes > 200 ? 2048 : bytes > 100 ? 1024 : 512;
};

const tag = (record: string, name: string) => unquote(record).match(new RegExp(`(?:^|;)\\s*${name}\\s*=\\s*([^;]+)`, "i"))?.[1].trim();

export function analyse(domain: string, a: Answers): Report {
  const checks: Check[] = [];
  const fixes: Fix[] = [];
  const mxHosts = a.mx.map(mxHost).filter((h) => h !== ".");
  const nullMx = a.mx.some((m) => mxHost(m) === ".");
  const provider = PROVIDERS.find((p) => mxHosts.some((h) => p.match.test(h)));
  const spfRecords = a.txt.filter(isSpf).map(unquote);
  const dkimKeys = Object.entries(a.dkim).filter(([, v]) => v.some((r) => keyBits(r) > 0));
  const sending = mxHosts.length > 0 || dkimKeys.length > 0 || spfRecords.some((r) => !/^v=spf1\s+-all\s*$/i.test(r));

  // MX
  if (mxHosts.length) checks.push({ id: "mx", level: "info", title: provider ? `Mail goes to ${provider.name}` : "Mail servers found", detail: `${mxHosts.length} mail ${mxHosts.length === 1 ? "server receives" : "servers receive"} mail for ${domain}.`, value: mxHosts.slice(0, 3).join(", ") });
  else checks.push({ id: "mx", level: "info", title: nullMx ? "Declared as not receiving mail" : "No mail servers", detail: nullMx ? "A null MX record says this domain takes no mail." : `${domain} has no MX record, so it receives no email.` });

  // SPF
  const spf = spfRecords[0];
  if (!spfRecords.length) {
    checks.push({ id: "spf", level: "fail", title: "No SPF record", detail: sending ? "Receivers can't tell which servers may send as this domain. Gmail requires SPF or DKIM from every sender, and both for bulk senders." : "Anyone can send email that claims to be from this domain." });
    fixes.push(sending ? { type: "TXT", host: "@", value: `v=spf1 ${provider?.include ? `include:${provider.include} ` : "mx "}~all`, why: provider ? `Lets ${provider.name} send as ${domain}. Add an include: for every other service that sends as you.` : "Lets your mail servers send as this domain; add an include: for each service that sends as you." } : { type: "TXT", host: "@", value: "v=spf1 -all", why: "Says no server may send as this domain (GOV.UK, domains that do not send email)." });
  } else if (spfRecords.length > 1) {
    checks.push({ id: "spf", level: "fail", title: "Two SPF records", detail: "With more than one SPF record, receivers treat SPF as broken (a permanent error). Merge them into one.", value: spfRecords.join(" | ") });
  } else {
    const all = spf.match(/\s([+?~-]?)all\s*$/i);
    const n = totalLookups(spf, a.spf);
    const q = all ? all[1] || "+" : spf.includes("redirect=") ? "redirect" : "";
    const level: Level = n > 10 || q === "+" ? "fail" : q === "?" || q === "" ? "warn" : provider?.include && !spf.toLowerCase().includes(provider.include) && !Object.keys(a.spf).some((k) => k === provider.include) ? "warn" : "pass";
    const detail =
      n > 10
        ? `It needs ${n} DNS lookups; receivers stop at 10 and fail SPF.`
        : q === "+"
          ? "It ends in +all, which lets every server on the internet send as this domain."
          : q === "?" || q === ""
            ? "It doesn't end with -all or ~all, so it doesn't say what to do with other servers."
            : provider?.include && level === "warn"
              ? `It doesn't include ${provider.name} (${provider.include}), where this domain's mail is hosted.`
              : `One record, ending in ${q === "-" ? "-all (fail others)" : q === "~" ? "~all (soft-fail others)" : "a redirect"}, using ${n} of the 10 DNS lookups allowed.`;
    checks.push({ id: "spf", level, title: level === "pass" ? "SPF is set up" : "SPF needs a fix", detail, value: spf });
  }

  // DKIM
  if (dkimKeys.length) {
    const weak = dkimKeys.filter(([, v]) => v.some((r) => keyBits(r) > 0 && keyBits(r) < 2048));
    checks.push({
      id: "dkim",
      level: weak.length ? "warn" : "pass",
      title: `DKIM found (${dkimKeys.map(([s]) => s).join(", ")})`,
      detail: weak.length ? `Signing keys work; ${weak.map(([s]) => s).join(", ")} ${weak.length === 1 ? "uses" : "use"} a 1024-bit key. 2048-bit is the current recommendation.` : "Messages can be signed, so receivers can check they weren't changed and really come from this domain.",
      value: dkimKeys.map(([s, v]) => `${s}: ${keyBits(v[0])}-bit`).join(", "),
    });
  } else if (sending) {
    // A selector can be any name, so "not found" isn't proof of "not set up": a warning, not a failure.
    checks.push({ id: "dkim", level: "warn", title: "No DKIM on the usual selectors", detail: `No signing key on ${provider ? `${provider.name}'s selector (${provider.selectors.join(", ")}) or ` : ""}the ${SELECTORS.length} common selectors. If your provider uses another selector name, add it and check again.` });
    fixes.push({ type: "TXT", host: `${provider?.selectors[0] ?? "selector"}._domainkey`, value: `(the key from ${provider?.name ?? "your email provider"}'s admin console)`, why: "Turn on DKIM signing with your provider; it gives you this record's value." });
  } else {
    checks.push({ id: "dkim", level: "info", title: "No DKIM keys", detail: "Fine for a domain that sends no email." });
    fixes.push({ type: "TXT", host: "*._domainkey", value: "v=DKIM1; p=", why: "An empty key makes receivers more likely to reject mail claiming to be from this domain (GOV.UK)." });
  }

  // DMARC
  const dmarc = a.dmarc.find((r) => /^v=DMARC1/i.test(r));
  if (!dmarc) {
    checks.push({ id: "dmarc", level: "fail", title: "No DMARC record", detail: sending ? "Gmail requires DMARC from bulk senders. Without it, nothing tells receivers what to do with mail that fails SPF and DKIM, and you get no reports." : "Nothing tells receivers to reject email that pretends to be from this domain." });
    fixes.push(sending ? { type: "TXT", host: "_dmarc", value: `v=DMARC1; p=none; rua=mailto:dmarc@${domain}`, why: "Starts DMARC in monitoring mode and sends daily reports. Move to p=quarantine once the reports look right." } : { type: "TXT", host: "_dmarc", value: `v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s; rua=mailto:dmarc@${domain}`, why: "Tells receivers to reject every email claiming to be from this domain (GOV.UK)." });
  } else {
    const p = (tag(dmarc, "p") ?? "").toLowerCase();
    const rua = tag(dmarc, "rua");
    const pct = Number(tag(dmarc, "pct") ?? 100);
    const level: Level = p === "reject" || p === "quarantine" ? (pct < 100 ? "warn" : "pass") : "warn";
    checks.push({
      id: "dmarc",
      level,
      title: `DMARC policy: ${p || "missing"}`,
      detail:
        p === "none"
          ? `Monitoring only: mail that fails is still delivered, so the domain can still be spoofed.${rua ? "" : " And no rua= address, so nobody receives the reports."}`
          : pct < 100
            ? `The policy applies to only ${pct}% of failing mail.`
            : `Failing mail is ${p === "reject" ? "rejected" : "sent to spam"}.${rua ? "" : " Add rua= to get reports."}`,
      value: dmarc,
    });
    if (p === "none" && sending) fixes.push({ type: "TXT", host: "_dmarc", value: `v=DMARC1; p=quarantine; rua=${rua ?? `mailto:dmarc@${domain}`}`, why: "Next step, once reports show your real mail passes: failing mail goes to spam." });
    else if (!rua) fixes.push({ type: "TXT", host: "_dmarc", value: `${dmarc.replace(/;?\s*$/, "")}; rua=mailto:dmarc@${domain}`, why: "Adds a report address, so you see who sends as your domain." });
  }

  if (!sending && !nullMx) fixes.push({ type: "MX", host: "@", value: "0 .", why: "A null MX says the domain takes no mail. Some DNS hosts can't create it; that's fine (GOV.UK)." });

  // Extras
  checks.push(a.mtasts.some((r) => /^v=STSv1/i.test(r)) ? { id: "mtasts", level: "pass", title: "MTA-STS published", detail: "Senders must use encrypted connections to deliver here." } : { id: "mtasts", level: "info", title: "No MTA-STS", detail: "Optional: forces encrypted delivery to this domain." });
  checks.push(a.bimi.some((r) => /^v=BIMI1/i.test(r)) ? { id: "bimi", level: "pass", title: "BIMI published", detail: "A brand logo can show next to authenticated mail." } : { id: "bimi", level: "info", title: "No BIMI", detail: "Optional: shows your logo in some inboxes; needs DMARC at quarantine or reject." });

  const lvl = (id: CheckId) => checks.find((c) => c.id === id)!.level;
  const spfOk = lvl("spf") === "pass" || lvl("spf") === "warn";
  const dkimOk = dkimKeys.length > 0;
  const gmailAll = (spfOk && spfRecords.length === 1) || dkimOk;
  const gmailBulk = spfRecords.length === 1 && spfOk && dkimOk && !!dmarc;
  const fails = checks.filter((c) => c.level === "fail").length;
  const verdict: Report["verdict"] = sending ? (fails ? "at-risk" : checks.some((c) => c.level === "warn") ? "almost" : "ready") : fails ? "at-risk" : (tag(dmarc ?? "", "p") ?? "").toLowerCase() === "reject" ? "ready" : "almost";
  return { domain, provider: provider?.name, sending, checks, fixes, gmailAll, gmailBulk, verdict };
}

/** Normalise what people type: "https://www.Example.com/x" → "example.com". */
export function cleanDomain(input: string) {
  const d = input.trim().toLowerCase().replace(/^[a-z]+:\/\//, "").replace(/[/?#].*$/, "").replace(/^www\./, "").replace(/\.$/, "");
  if (!/^(?=.{3,253}$)([a-z0-9-]{1,63}\.)+[a-z]{2,63}$/.test(d)) throw new Error(`"${input}" isn't a domain name.`);
  return d;
}

export const VERDICT_LABEL: Record<Report["verdict"], string> = { ready: "Ready", almost: "Almost there", "at-risk": "At risk" };

/** The values the three templates take. */
export function toValues(r: Report, meta: { checked: string; preparedBy?: string; client?: string }) {
  return {
    domain: r.domain,
    checked: meta.checked,
    preparedBy: meta.preparedBy?.trim().slice(0, 80) || undefined,
    client: meta.client?.trim().slice(0, 80) || undefined,
    provider: r.provider,
    sending: r.sending,
    verdict: r.verdict,
    gmailAll: r.gmailAll,
    gmailBulk: r.gmailBulk,
    checks: r.checks.map((c) => ({ id: c.id, level: c.level, title: c.title.slice(0, 80), detail: c.detail.slice(0, 300), value: c.value?.slice(0, 400) })),
    fixes: r.fixes.slice(0, 8).map((f) => ({ type: f.type, host: f.host.slice(0, 80), value: f.value.slice(0, 300), why: f.why.slice(0, 220) })),
  };
}
