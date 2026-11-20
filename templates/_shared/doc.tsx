/**
 * What every Inboxed template shares: the fields (one domain's checks and the records to add), the postal look,
 * and the postmark seal that carries the verdict.
 */
import { Circle, Column, Layer, Path, Svg, Text, defineTheme, prop } from "@hyper-elements/react";
import { formatDate } from "@hyper-elements/react/template";
import { VERDICT_LABEL, type Check, type Fix, type Level, type Report } from "./mail.ts";
import sample from "./example.ts";

export const fields = {
  domain: prop.text({ label: "Domain", required: true, maxLength: 253, pattern: "^([a-z0-9-]+\\.)+[a-z]{2,}$" }),
  checked: prop.date({ label: "Checked on", required: true }),
  preparedBy: prop.text({ label: "Prepared by", maxLength: 80 }),
  client: prop.text({ label: "Prepared for", maxLength: 80 }),
  provider: prop.text({ label: "Mail provider", maxLength: 60 }),
  sending: prop.boolean({ label: "Sends email", default: true }),
  verdict: prop.choice(["ready", "almost", "at-risk"], { label: "Verdict", required: true }),
  gmailAll: prop.boolean({ label: "Meets Gmail's rule for all senders", default: false }),
  gmailBulk: prop.boolean({ label: "Meets Gmail's rule for bulk senders", default: false }),
  checks: prop.list(
    prop.object(
      {
        id: prop.choice(["mx", "spf", "dkim", "dmarc", "mtasts", "bimi"], { label: "Check", required: true }),
        level: prop.choice(["pass", "warn", "fail", "info"], { label: "Result", required: true }),
        title: prop.text({ label: "Title", required: true, maxLength: 80 }),
        detail: prop.text({ label: "What it means", required: true, maxLength: 300 }),
        value: prop.text({ label: "Record found", maxLength: 400 }),
      },
      { label: "Check" },
    ),
    { label: "Checks", required: true, min: 1, max: 10 },
  ),
  fixes: prop.list(
    prop.object(
      {
        type: prop.choice(["TXT", "MX"], { label: "Type", required: true }),
        host: prop.text({ label: "Host / name", required: true, maxLength: 80 }),
        value: prop.text({ label: "Value", required: true, maxLength: 300 }),
        why: prop.text({ label: "Why", required: true, maxLength: 220 }),
      },
      { label: "Record" },
    ),
    { label: "Records to add", max: 8 },
  ),
};

export type Values = {
  domain: string;
  checked: string;
  preparedBy?: string;
  client?: string;
  provider?: string;
  sending: boolean;
  verdict: Report["verdict"];
  gmailAll: boolean;
  gmailBulk: boolean;
  checks: Check[];
  fixes: Fix[];
};

/** The sample: getrevlio.com on 20 Nov 2026. */
export const example = sample as unknown as Values;

/* ---------- look: the post ---------- */

export const INK = "#13191C";
export const INK2 = "#3B4549";
export const MUTED = "#5D686D";
export const LINE = "#DDE3E4";
export const WASH = "#F2F5F5";
export const PAPER = "#FFFFFF";
export const TEAL = "#0E4A52";
export const PASS = "#1B7A4A";
export const WARN = "#8A5A00";
export const FAIL = "#B42318";
export const INFO = "#4E5A60";

export const SANS = "'Hanken Grotesk', 'Helvetica Neue', Arial, sans-serif";
export const MONO = "'Fragment Mono', Menlo, Consolas, monospace";

export const FONT_FILES = [400, 500, 600, 700, 800].map((w) => ({ family: "Hanken Grotesk", src: `../fonts/HankenGrotesk-${w}.woff`, weight: w })).concat([{ family: "Fragment Mono", src: "../fonts/FragmentMono-400.woff", weight: 400 }]);
const CDN = "https://cdn.jsdelivr.net/npm/@fontsource";
export const FONT_URLS = [
  { family: "Hanken Grotesk", src: `${CDN}/hanken-grotesk@5.3.0/files/hanken-grotesk-latin-400-normal.woff2`, weight: 400 },
  { family: "Hanken Grotesk", src: `${CDN}/hanken-grotesk@5.3.0/files/hanken-grotesk-latin-700-normal.woff2`, weight: 700 },
  { family: "Fragment Mono", src: `${CDN}/fragment-mono@5.3.0/files/fragment-mono-latin-400-normal.woff2`, weight: 400 },
];

export const theme = defineTheme({
  colors: { background: WASH, foreground: INK, primary: TEAL, primaryForeground: PAPER, muted: MUTED, border: LINE, paper: PAPER, teal: TEAL },
  fonts: { body: SANS, heading: SANS },
  fontSizes: { body: 16 },
  lineHeights: { body: 1.6 },
  elements: { Heading: { fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.15, by: { level: { 1: { fontSize: 30, mobile: { fontSize: 25 } }, 2: { fontSize: 19 } } } } },
  styles: {
    label: { fontFamily: MONO, fontSize: 12, letterSpacing: 0.4, textTransform: "uppercase", color: MUTED },
    sheet: { backgroundColor: PAPER, padding: 32, gap: 18, border: `1px solid ${LINE}` },
  },
});

/* ---------- helpers ---------- */

export const longDate = (iso: string) => formatDate(iso, "en-GB", { day: "numeric", month: "long", year: "numeric" });
export const levelColor = (l: Level) => (l === "pass" ? PASS : l === "warn" ? WARN : l === "fail" ? FAIL : INFO);
export const LEVEL_LABEL: Record<Level, string> = { pass: "Pass", warn: "Fix soon", fail: "Fix now", info: "Note" };
export const CHECK_NAME: Record<Check["id"], string> = { mx: "Mail servers (MX)", spf: "SPF", dkim: "DKIM", dmarc: "DMARC", mtasts: "MTA-STS", bimi: "BIMI" };
export const verdictLabel = (v: Values["verdict"]) => VERDICT_LABEL[v];
export const verdictColor = (v: Values["verdict"]) => (v === "ready" ? PASS : v === "almost" ? WARN : FAIL);
export const core = (v: Values) => v.checks.filter((c) => c.id === "spf" || c.id === "dkim" || c.id === "dmarc");
export const GMAIL_URL = "https://support.google.com/mail/answer/81126";
export const GOVUK_URL = "https://www.gov.uk/guidance/protect-domains-that-dont-send-email";

/** A postmark: two rings with cancellation waves, the verdict in the middle (labels sit in a Layer over the Svg). */
export function Seal({ verdict, size, date }: { verdict: Values["verdict"]; size: number; date: string }) {
  const c = verdictColor(verdict);
  const r = size / 2;
  const wave = (y: number) => `M${size * 1.02} ${y} q ${size * 0.12} -${size * 0.06} ${size * 0.24} 0 t ${size * 0.24} 0 t ${size * 0.24} 0`;
  return (
    <Layer style={{ width: size * 1.8, height: size, alignItems: "center" }}>
      <Svg width={size * 1.8} height={size} title={`Verdict: ${verdictLabel(verdict)}`}>
        <Circle cx={r} cy={r} r={r - 2} style={{ fill: "transparent", stroke: c, strokeWidth: 2.5 }} />
        <Circle cx={r} cy={r} r={r - 9} style={{ fill: "transparent", stroke: c, strokeWidth: 1 }} />
        <Path d={wave(r - size * 0.14)} style={{ fill: "transparent", stroke: c, strokeWidth: 2 }} />
        <Path d={wave(r)} style={{ fill: "transparent", stroke: c, strokeWidth: 2 }} />
        <Path d={wave(r + size * 0.14)} style={{ fill: "transparent", stroke: c, strokeWidth: 2 }} />
      </Svg>
      {/* The Layer centres its child across the whole seal; right padding puts the labels on the circle. */}
      <Column style={{ width: size * 1.8, padding: [0, size * 0.8, 0, 0], gap: 0 }}>
        <Text style={{ width: size, textAlign: "center", fontFamily: MONO, fontSize: size * 0.075, letterSpacing: 1, color: c }}>INBOXED</Text>
        <Text style={{ width: size, textAlign: "center", fontWeight: 800, fontSize: size * 0.15, lineHeight: 1.1, color: c }}>{verdictLabel(verdict)}</Text>
        <Text style={{ width: size, textAlign: "center", fontFamily: MONO, fontSize: size * 0.07, color: c }}>{date}</Text>
      </Column>
    </Layer>
  );
}
