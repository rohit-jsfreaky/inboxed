import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { analyse, cleanDomain, gather, type Answers, type Resolve } from "../templates/_shared/mail.ts";

const snap = JSON.parse(readFileSync(new URL("../public/samples/domains-2026-11-20.json", import.meta.url), "utf8"));
const empty: Answers = { mx: [], txt: [], dmarc: [], dkim: {}, spf: {}, mtasts: [], bimi: [] };
const level = (a: Answers, id: string, domain = "example.com") => analyse(domain, a).checks.find((c) => c.id === id)!.level;

test("getrevlio.com, 20 Nov 2026: Google Workspace, no SPF, DKIM found, DMARC p=none", () => {
  const r = analyse("getrevlio.com", snap.answers["getrevlio.com"]);
  assert.equal(r.provider, "Google Workspace");
  assert.deepEqual(r.checks.filter((c) => ["spf", "dkim", "dmarc"].includes(c.id)).map((c) => c.level), ["fail", "warn", "warn"]);
  assert.equal(r.gmailAll, true); // DKIM alone meets "SPF or DKIM"
  assert.equal(r.gmailBulk, false);
  assert.deepEqual(r.fixes.map((f) => [f.host, f.value]), [["@", "v=spf1 include:_spf.google.com ~all"], ["_dmarc", "v=DMARC1; p=quarantine; rua=mailto:dmarc@getrevlio.com"]]);
});

test("provryn.pro, 20 Nov 2026: no email, so GOV.UK's records for a domain that doesn't send", () => {
  const r = analyse("provryn.pro", snap.answers["provryn.pro"]);
  assert.equal(r.sending, false);
  assert.deepEqual(r.fixes.map((f) => `${f.type} ${f.host} ${f.value}`), ["TXT @ v=spf1 -all", "TXT *._domainkey v=DKIM1; p=", "TXT _dmarc v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s; rua=mailto:dmarc@provryn.pro", "MX @ 0 ."]);
});

test("SPF: two records, +all, and more than 10 lookups all fail", () => {
  assert.equal(level({ ...empty, mx: ["10 mx.example.com."], txt: ["v=spf1 mx ~all", "v=spf1 a ~all"] }, "spf"), "fail");
  assert.equal(level({ ...empty, mx: ["10 mx.example.com."], txt: ["v=spf1 +all"] }, "spf"), "fail");
  const includes = Array.from({ length: 11 }, (_, i) => `include:s${i}.example.net`).join(" ");
  assert.equal(level({ ...empty, mx: ["10 mx.example.com."], txt: [`v=spf1 ${includes} ~all`] }, "spf"), "fail");
  assert.equal(level({ ...empty, mx: ["10 mx.example.com."], txt: ["v=spf1 include:spf.example.net -all"], spf: { "spf.example.net": ["v=spf1 ip4:192.0.2.0/24 -all"] } }, "spf"), "pass");
});

test("DMARC: none warns, quarantine at 100% passes, pct below 100 warns", () => {
  const base = { ...empty, mx: ["10 mx.example.com."], txt: ["v=spf1 mx -all"] };
  assert.equal(level({ ...base, dmarc: ["v=DMARC1; p=none; rua=mailto:d@example.com"] }, "dmarc"), "warn");
  assert.equal(level({ ...base, dmarc: ["v=DMARC1; p=quarantine; rua=mailto:d@example.com"] }, "dmarc"), "pass");
  assert.equal(level({ ...base, dmarc: ["v=DMARC1; p=reject; pct=50"] }, "dmarc"), "warn");
});

test("gather follows SPF includes and finds DKIM on common selectors", async () => {
  const zone: Record<string, string[]> = {
    "example.com TXT": ["v=spf1 include:_spf.google.com ~all"],
    "example.com MX": ["1 smtp.google.com."],
    "_spf.google.com TXT": ["v=spf1 ip4:74.125.0.0/16 ~all"],
    "google._domainkey.example.com TXT": ["v=DKIM1; k=rsa; p=" + "A".repeat(392)],
    "_dmarc.example.com TXT": ['"v=DMARC1; p=reject;"'],
  };
  const resolve: Resolve = async (name, type) => zone[`${name} ${type}`] ?? [];
  const a = await gather("example.com", resolve);
  assert.deepEqual(Object.keys(a.spf), ["_spf.google.com"]);
  assert.deepEqual(Object.keys(a.dkim), ["google"]);
  const r = analyse("example.com", a);
  assert.deepEqual([r.verdict, r.gmailBulk], ["ready", true]);
});

test("domains are cleaned, junk is refused", () => {
  assert.equal(cleanDomain(" https://www.Example.COM/pricing "), "example.com");
  assert.throws(() => cleanDomain("not a domain"));
});
