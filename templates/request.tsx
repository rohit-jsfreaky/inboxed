/**
 * The DNS change request: an email to whoever manages the domain's DNS, with each record to add written so it can be
 * copied exactly.
 */
import { Column, Email, Heading, Section, Span, Text, token } from "@hyper-elements/react";
import { lint } from "@hyper-elements/lint";
import { template } from "@hyper-elements/react/template";
import { FONT_URLS, MONO, TEAL, example, fields, longDate, theme, verdictLabel, type Values } from "./_shared/doc.tsx";

const LABEL = { fontFamily: MONO, fontSize: 12, letterSpacing: 0.4, textTransform: "uppercase", color: "#5D686D" } as const;

export default template({
  id: "inboxed.Request",
  version: "1.0.0",
  label: "DNS change request (email)",
  guidance: "Send it to whoever manages the domain's DNS. Attach the report for the why.",
  root: "Email",
  fields,
  rules: { plugins: { lint: lint() }, require: { lint: ["lang", "contrast", "link-text"] }, root: { previewText: true } },
  example,
  render(input) {
    const v = input as unknown as Values;
    const n = v.fixes.length;
    return (
      <Email theme={theme} lang="en" width={600} fonts={FONT_URLS} title={`DNS changes for ${v.domain}`} previewText={n ? `${n} DNS ${n === 1 ? "record" : "records"} to add for ${v.domain}, with the exact values.` : `${v.domain}: no changes needed.`} style={{ gap: 0 }}>
        <Section style={{ padding: [28, 24, 14] }}>
          <Text style={LABEL}>
            DNS change · {v.domain}
            {v.preparedBy ? ` · ${v.preparedBy}` : ""}
          </Text>
        </Section>
        <Column style={{ apply: ["sheet"] }}>
          <Heading level={1}>{n ? `${n} DNS ${n === 1 ? "record" : "records"} to add for ${v.domain}` : `${v.domain} needs no changes`}</Heading>
          <Text>Hello,</Text>
          <Text>
            {n
              ? `We checked ${v.domain}'s email authentication on ${longDate(v.checked)} (verdict: ${verdictLabel(v.verdict).toLowerCase()}). ${v.sending ? "So that Gmail and other receivers trust mail from it" : "So that nobody can send email pretending to be this domain"}, please add ${n === 1 ? "this record" : "these records"} at the DNS host. If a record with the same host already exists, replace it.`
              : `We checked ${v.domain}'s email authentication on ${longDate(v.checked)}. Everything is in place.`}
          </Text>
          {v.fixes.map((f, i) => (
            <Column key={i} style={{ gap: 4, padding: [14, 16], backgroundColor: token("colors.background"), border: { left: { width: 3, style: "solid", color: TEAL } } }}>
              <Text style={{ fontFamily: MONO, fontSize: 13, color: token("colors.muted") }}>
                {f.type} record, host <Span style={{ color: TEAL }}>{f.host}</Span>
              </Text>
              <Text style={{ fontFamily: MONO, fontSize: 14, color: TEAL }}>{f.value}</Text>
              <Text style={{ fontSize: 14, color: token("colors.muted") }}>{f.why}</Text>
            </Column>
          ))}
          <Text style={{ fontSize: 15, color: token("colors.muted") }}>
            Changes can take up to a few hours to appear. We&apos;ll check again once they&apos;re in and confirm.
          </Text>
          <Text>{v.preparedBy ?? "Thanks"}</Text>
        </Column>
        <Section style={{ padding: [20, 24, 32] }}>
          <Text style={{ fontSize: 14, color: token("colors.muted") }}>Why: Gmail requires SPF or DKIM from every sender, and SPF, DKIM and DMARC from bulk senders (support.google.com/mail/answer/81126).</Text>
        </Section>
      </Email>
    );
  },
});
