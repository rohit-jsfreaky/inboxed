/**
 * The status card: 1200 × 630, for the client chat or a proposal. The three checks that matter, the verdict seal.
 */
import { Canvas, Column, Row, Text } from "@hyper-elements/react";
import { template } from "@hyper-elements/react/template";
import { CHECK_NAME, FONT_FILES, INK, LEVEL_LABEL, LINE, MONO, MUTED, PAPER, SANS, Seal, TEAL, core, example, fields, levelColor, longDate, type Values } from "./_shared/doc.tsx";

const W = 1200;
const H = 630;
const PAD = 64;

export default template({
  id: "inboxed.Card",
  version: "1.0.0",
  label: "Status card (PNG)",
  guidance: "For a client chat or a proposal: where the domain stands, at a glance.",
  root: "Canvas",
  formats: { og: { width: W, height: H, scale: 1 } },
  fields,
  rules: { require: { core: ["image/overflow", "image/glyph", "image/fit"] } },
  example,
  render(input) {
    const v = input as unknown as Values;
    const three = core(v);
    const colW = (W - PAD * 2 - 40) / 3;
    return (
      <Canvas width={W} height={H} fonts={FONT_FILES} style={{ backgroundColor: PAPER, fontFamily: SANS, color: INK, padding: 0, gap: 0 }}>
        <Row style={{ width: W, padding: [76, PAD, 0], alignItems: "center" }}>
          <Column style={{ width: W - PAD * 2 - 330, gap: 8 }}>
            <Text style={{ width: W - PAD * 2 - 330, fontFamily: MONO, fontSize: 18, letterSpacing: 1, color: TEAL }}>EMAIL AUTHENTICATION</Text>
            <Text fit={{ sizes: [56, 48, 40, 34], maxLines: 1 }} style={{ width: W - PAD * 2 - 330, fontFamily: MONO, lineHeight: 1.15 }}>
              {v.domain}
            </Text>
            <Text style={{ width: W - PAD * 2 - 330, fontSize: 21, color: MUTED }}>{`Checked ${longDate(v.checked)}${v.provider ? ` · ${v.provider}` : ""}`}</Text>
          </Column>
          <Column style={{ width: 330, alignItems: "end" }}>
            <Seal verdict={v.verdict} size={180} date={v.checked} />
          </Column>
        </Row>
        <Row style={{ width: W, padding: [58, PAD, 0], gap: 20 }}>
          {three.map((c) => (
            <Column key={c.id} style={{ width: colW, gap: 6, padding: [18, 0, 0], border: { top: `5px solid ${levelColor(c.level)}` } }}>
              <Text style={{ width: colW, fontWeight: 800, fontSize: 34 }}>{CHECK_NAME[c.id]}</Text>
              <Text style={{ width: colW, fontFamily: MONO, fontSize: 18, color: levelColor(c.level) }}>{LEVEL_LABEL[c.level].toUpperCase()}</Text>
              <Text fit={{ sizes: [20, 18, 16], maxLines: 2 }} style={{ width: colW, color: MUTED, lineHeight: 1.3 }}>
                {c.title}
              </Text>
            </Column>
          ))}
        </Row>
        <Row style={{ width: W, padding: [44, PAD, 0] }}>
          <Column style={{ width: W - PAD * 2, padding: [16, 0, 0], border: { top: `1px solid ${LINE}` } }}>
            <Text style={{ width: W - PAD * 2, fontSize: 19, color: MUTED }}>
              {v.sending ? `Gmail's rules: all senders ${v.gmailAll ? "met" : "not met"}, bulk senders ${v.gmailBulk ? "met" : "not met"}` : "Doesn't send email: it should still say so in DNS, so nobody can spoof it"}
            </Text>
          </Column>
        </Row>
      </Canvas>
    );
  },
});
