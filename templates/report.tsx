/**
 * The client report: an A4 PDF a developer or agency hands over. The verdict, Gmail's two rules, every check in
 * plain words, and the exact records to add.
 */
import { Column, Document, Heading, PageFooter, PageNumber, Row, Table, TableCell, TableRow, Text } from "@hyper-elements/react";
import { template } from "@hyper-elements/react/template";
import { CHECK_NAME, FAIL, FONT_FILES, GMAIL_URL, GOVUK_URL, INK, INK2, LEVEL_LABEL, LINE, MONO, MUTED, PASS, PAPER, SANS, Seal, TEAL, WASH, example, fields, levelColor, longDate, type Values } from "./_shared/doc.tsx";

const W = 682; // A4 at 96 px/in (794) less 56 px margins
const label = { fontFamily: MONO, fontSize: 8, fontWeight: 400, letterSpacing: 0.6, textTransform: "uppercase", color: MUTED } as const;

function Rule({ met, title, need }: { met: boolean; title: string; need: string }) {
  return (
    <Column style={{ gap: 3, padding: [10, 12], border: `1px solid ${met ? PASS : FAIL}`, backgroundColor: PAPER }}>
      <Text style={{ fontFamily: MONO, fontSize: 8.5, color: met ? PASS : FAIL }}>{met ? "MET" : "NOT MET"}</Text>
      <Text style={{ fontWeight: 700, fontSize: 10.5 }}>{title}</Text>
      <Text style={{ fontSize: 9, color: MUTED }}>{need}</Text>
    </Column>
  );
}

export default template({
  id: "inboxed.Report",
  version: "1.0.0",
  label: "Email authentication report (PDF)",
  guidance: "Hand it to the client with the DNS change request. Records reflect the DNS on the date checked.",
  root: "Document",
  formats: { a4: { size: "A4", orientation: "portrait" } },
  fields,
  example,
  render(input) {
    const v = input as unknown as Values;
    return (
      <Document size="A4" margin={56} title={`${v.domain}: email authentication report`} lang="en" fonts={FONT_FILES} style={{ fontFamily: SANS, fontSize: 10.5, color: INK, gap: 14 }}>
        <Row style={{ alignItems: "start" }}>
          <Column style={{ gap: 4 }}>
            <Text style={{ ...label, color: TEAL }}>Email authentication report</Text>
            <Heading level={1} style={{ fontFamily: MONO, fontWeight: 400, fontSize: 26, lineHeight: 1.15, letterSpacing: -0.5 }}>
              {v.domain}
            </Heading>
            <Text style={{ fontSize: 9.5, color: MUTED }}>
              {[v.client ? `For ${v.client}` : "", v.preparedBy ? `by ${v.preparedBy}` : "", `checked ${longDate(v.checked)}`].filter(Boolean).join(" · ")}
            </Text>
            <Text style={{ fontSize: 9.5, color: MUTED }}>{v.sending ? `Sends email${v.provider ? ` through ${v.provider}` : ""}.` : "Doesn't send email."}</Text>
          </Column>
          <Column style={{ width: 180, alignItems: "end" }}>
            <Seal verdict={v.verdict} size={96} date={v.checked} />
          </Column>
        </Row>

        {v.sending ? (
          <Row style={{ gap: 10 }}>
            <Rule met={v.gmailAll} title="Gmail, all senders" need="SPF or DKIM" />
            <Rule met={v.gmailBulk} title="Gmail, 5,000+ a day" need="SPF, DKIM and DMARC" />
          </Row>
        ) : (
          <Column style={{ padding: [10, 12], backgroundColor: WASH, gap: 3 }}>
            <Text style={{ fontWeight: 700 }}>A domain that doesn&apos;t send email still needs records.</Text>
            <Text style={{ fontSize: 9.5, color: INK2 }}>Without them, anyone can send mail that claims to be from it. The records below follow GOV.UK&apos;s guidance for domains that do not send email.</Text>
          </Column>
        )}

        <Column style={{ gap: 0 }}>
          <Text style={{ ...label, color: INK, padding: [0, 0, 6] }}>The checks</Text>
          {v.checks.map((c) => (
            <Row key={c.id} style={{ gap: 12, padding: [9, 0], border: { top: `0.75px solid ${LINE}` }, alignItems: "start" }}>
              <Column style={{ width: 70 }}>
                <Text style={{ fontFamily: MONO, fontSize: 8.5, color: levelColor(c.level) }}>{LEVEL_LABEL[c.level].toUpperCase()}</Text>
              </Column>
              <Column style={{ gap: 2 }}>
                <Text style={{ fontWeight: 700 }}>
                  {CHECK_NAME[c.id]}: {c.title}
                </Text>
                <Text style={{ fontSize: 9.5, lineHeight: 1.5, color: INK2 }}>{c.detail}</Text>
                {c.value ? <Text style={{ fontFamily: MONO, fontSize: 7.5, color: MUTED }}>{c.value.length > 180 ? `${c.value.slice(0, 179)}…` : c.value}</Text> : null}
              </Column>
            </Row>
          ))}
        </Column>

        {v.fixes.length ? (
          <Column style={{ gap: 6 }}>
            <Text style={{ ...label, color: INK }}>Records to add at the DNS host</Text>
            <Table style={{ width: W, cellPadding: [6, 6], rowBorder: { width: 0.5, style: "solid", color: LINE }, border: { width: 0.75, style: "solid", color: LINE } }}>
              <TableRow header>
                <TableCell style={{ ...label, width: 40 }}>Type</TableCell>
                <TableCell style={{ ...label, width: 90 }}>Host</TableCell>
                <TableCell style={{ ...label, width: 280 }}>Value</TableCell>
                <TableCell style={label}>Why</TableCell>
              </TableRow>
              {v.fixes.map((f, i) => (
                <TableRow key={i}>
                  <TableCell style={{ fontFamily: MONO, fontSize: 8.5, verticalAlign: "top" }}>{f.type}</TableCell>
                  <TableCell style={{ fontFamily: MONO, fontSize: 8.5, verticalAlign: "top" }}>{f.host}</TableCell>
                  <TableCell style={{ fontFamily: MONO, fontSize: 8.5, verticalAlign: "top", color: TEAL }}>{f.value}</TableCell>
                  <TableCell style={{ fontSize: 8.5, verticalAlign: "top", color: INK2 }}>{f.why}</TableCell>
                </TableRow>
              ))}
            </Table>
          </Column>
        ) : null}

        <Text style={{ fontSize: 8.5, color: MUTED, lineHeight: 1.5 }}>
          Sources: Gmail email sender guidelines ({GMAIL_URL}){v.sending ? "" : `; GOV.UK, Protect domains that do not send email (${GOVUK_URL})`}. DNS read on {longDate(v.checked)}; DKIM was looked for on common selector names.
        </Text>

        <PageFooter style={{ padding: [10, 0, 0], border: { top: `0.75px solid ${LINE}` } }}>
          <Row>
            <Column>
              <Text style={{ fontSize: 7.5, color: MUTED }}>{v.domain} · email authentication report · {longDate(v.checked)}</Text>
            </Column>
            <Column>
              <Text style={{ fontSize: 7.5, color: MUTED, textAlign: "right" }}>
                Page <PageNumber /> of <PageNumber total />
              </Text>
            </Column>
          </Row>
        </PageFooter>
      </Document>
    );
  },
});
