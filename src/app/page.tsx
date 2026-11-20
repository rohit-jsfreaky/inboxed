import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, ArrowUpRight, FileCheck02, Image01, Mail01 } from "@untitledui/icons";
import { Mark } from "@/components/Mark";

const WRAP = "mx-auto max-w-[1200px] px-6";

export default function Home() {
  return (
    <div className="bg-paper text-ink">
      <Nav />
      <Hero />
      <Why />
      <Example />
      <How />
      <Outputs />
      <Checks />
      <Faq />
      <Close />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur border-b border-line">
      <div className="h-1.5 airmail" aria-hidden="true" />
      <div className={`${WRAP} h-16 flex items-center gap-4 md:gap-8`}>
        <Link href="/" className="flex items-center gap-2 font-extrabold text-[20px] tracking-tight">
          <Mark /> Inboxed
        </Link>
        <nav className="hidden md:flex gap-6 text-[14px] font-medium text-muted">
          <a href="#why" className="hover:text-ink">Why</a>
          <a href="#example" className="hover:text-ink">Example</a>
          <a href="#how" className="hover:text-ink">How it works</a>
          <a href="#outputs" className="hover:text-ink">What you send</a>
          <a href="#faq" className="hover:text-ink">FAQ</a>
        </nav>
        <div className="flex-1" />
        <Link href="/check" className="btn btn-teal">
          <span className="hidden sm:inline">Check a domain</span>
          <span className="sm:hidden">Start</span> <ArrowRight size={16} />
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="border-b border-line">
      <div className={`${WRAP} pt-16 md:pt-24`}>
        <p className="tag">For developers and agencies who set up email for clients</p>
        <h1 className="mt-5 font-extrabold text-[48px] md:text-[86px] leading-[0.98] tracking-[-0.035em] max-w-[1000px]">
          Will this domain&apos;s email <span className="text-teal">land in the inbox?</span>
        </h1>
        <div className="mt-8 grid md:grid-cols-[1fr_auto] gap-8 items-end">
          <p className="text-[18px] md:text-[19px] leading-relaxed text-ink-2 max-w-[620px]">
            Type a domain. Inboxed reads its SPF, DKIM and DMARC records, checks them against Gmail&apos;s sender rules, and writes the client report, the exact DNS records to add, and a status card.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/check" className="btn btn-teal !px-5 !py-3 !text-[15px]">
              Check a domain <ArrowRight size={17} />
            </Link>
            <a href="/landing/getrevlio-report.pdf" className="btn btn-line !px-5 !py-3 !text-[15px]">
              Sample report (PDF)
            </a>
          </div>
        </div>
        <figure className="mt-12 rounded-t-3xl border border-b-0 border-rule bg-wash p-2.5 pb-0 shadow-[0_-24px_60px_-34px_rgb(14_74_82/0.4)]">
          <Image src="/landing/postroom.png" alt="Inboxed checking getrevlio.com: no SPF record, DKIM found, DMARC set to none, so it doesn't meet Gmail's bulk sender rule" width={1440} height={900} priority className="w-full h-auto rounded-t-2xl border border-b-0 border-line" />
        </figure>
      </div>
    </section>
  );
}

function Why() {
  return (
    <section id="why" className="border-b border-line bg-wash">
      <div className={`${WRAP} py-20 md:py-28 grid md:grid-cols-[1fr_1fr] gap-12 items-start`}>
        <div>
          <Head n="01" eyebrow="Why" title="Gmail stopped taking unauthenticated mail." />
          <div className="mt-8 bg-paper border border-line rounded-2xl p-6">
            <p className="tag">Gmail&apos;s email sender guidelines</p>
            <ul className="mt-3 space-y-2 text-[16px]">
              <li>
                <span className="font-bold">All senders:</span> SPF or DKIM
              </li>
              <li>
                <span className="font-bold">Bulk senders (5,000+ a day):</span> SPF, DKIM, and DMARC
              </li>
            </ul>
            <p className="mt-4 text-[14.5px] text-ink-2 leading-relaxed">&ldquo;Messages that aren&apos;t authenticated with these methods might be marked as spam or rejected with a 5.7.26 error.&rdquo;</p>
            <a className="mt-3 inline-flex items-center gap-1 text-[13.5px] font-semibold text-teal underline underline-offset-2" href="https://support.google.com/mail/answer/81126">
              support.google.com/mail/answer/81126 <ArrowUpRight size={13} />
            </a>
          </div>
        </div>
        <div className="md:pt-24">
          <blockquote className="border-l-4 border-fail pl-6">
            <p className="font-bold text-[24px] md:text-[28px] leading-snug tracking-tight">
              &ldquo;Same issue here, just noticed when I tried to email a client today. No idea if I&apos;ve been losing the emails they&apos;ve been sending me over the last week as well.&rdquo;
            </p>
            <footer className="mt-4 text-[14px] text-muted">
              A reply under{" "}
              <a className="underline underline-offset-2 hover:text-ink" href="https://old.reddit.com/r/squarespace/comments/1k11vmb/">
                &ldquo;550 5.7.26 Unauthenticated email errors&rdquo;
              </a>
              , r/squarespace, April 2025. The original post: &ldquo;This entire thing is a total disaster!&rdquo;
            </footer>
          </blockquote>
        </div>
      </div>
    </section>
  );
}

const EXAMPLE = [
  ["getrevlio.com", "Google Workspace", [["SPF", "fail", "No record"], ["DKIM", "warn", "google 2048, resend 1024-bit"], ["DMARC", "warn", "p=none, no reports"]], "v=spf1 include:_spf.google.com ~all"],
  ["provryn.pro", "Doesn't send email", [["SPF", "fail", "No record"], ["DKIM", "info", "None (fine)"], ["DMARC", "fail", "No record"]], "v=spf1 -all, and DMARC p=reject"],
] as const;
const DOT = { pass: "bg-pass", warn: "bg-warn", fail: "bg-fail", info: "bg-rule" } as const;

function Example() {
  return (
    <section id="example" className="border-b border-line">
      <div className={`${WRAP} py-20 md:py-28`}>
        <Head n="02" eyebrow="A real example" title="Two real domains, checked on 20 November 2026.">
          Both belong to the person who built this. One sends email through Google Workspace and has no SPF record at all. The other never sends email, and nothing stops anyone from sending mail that claims to be from it.
        </Head>
        <div className="mt-12 grid md:grid-cols-2 gap-4">
          {EXAMPLE.map(([d, who, lights, fix]) => (
            <div key={d} className="border border-line rounded-2xl p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[22px]">{d}</p>
                  <p className="text-[13.5px] text-muted">{who}</p>
                </div>
                <span className="shrink-0 text-[12px] font-bold border-2 border-fail text-fail rounded-full px-3 py-1">At risk</span>
              </div>
              <div className="mt-5 space-y-2">
                {lights.map(([n, l, t]) => (
                  <div key={n} className="flex items-center gap-3 text-[14.5px]">
                    <span className={`size-2.5 rounded-full ${DOT[l]}`} />
                    <span className="w-14 font-bold">{n}</span>
                    <span className="text-ink-2">{t}</span>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-[13px] text-muted">First record to add</p>
              <p className="font-mono text-[13.5px] text-teal break-all">{fix}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function How() {
  const steps = [
    ["Type the domains", "One or many. Your browser asks public DNS directly, over HTTPS. No account, nothing to install."],
    ["Read the verdict", "SPF, DKIM and DMARC, each in plain words, and whether Gmail's two rules are met. Domains that don't send email are judged as such."],
    ["Copy the records", "The exact records to add, worked out from the mail provider the domain uses, each with a copy button and the reason."],
    ["Send the paperwork", "The report for the client, the DNS request for whoever holds the keys, and a card for the chat."],
  ];
  return (
    <section id="how" className="border-b border-line bg-wash">
      <div className={`${WRAP} py-20 md:py-28`}>
        <Head n="03" eyebrow="How it works" title="A domain in, the fix out." />
        <ol className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map(([t, d], i) => (
            <li key={t} className="bg-paper border border-line rounded-2xl p-6">
              <span className="grid place-items-center size-10 rounded-full border-2 border-teal text-teal font-mono text-[15px]">{i + 1}</span>
              <h3 className="mt-4 font-extrabold text-[21px] tracking-tight">{t}</h3>
              <p className="mt-2 text-[15px] text-ink-2 leading-relaxed">{d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Outputs() {
  return (
    <section id="outputs" className="border-b border-line">
      <div className={`${WRAP} py-20 md:py-28`}>
        <Head n="04" eyebrow="What you send" title="The report, the records, the card.">
          Rendered by shared Hyper Elements templates, in the app or from the command line.
        </Head>
        <div className="mt-12 grid md:grid-cols-12 gap-4">
          <Tile className="md:col-span-5 md:row-span-2" icon={<FileCheck02 size={17} />} name="The client report" note="A4 PDF · verdict, Gmail's rules, every check, the records">
            <Image src="/landing/report.png" alt="Client report for getrevlio.com with the At risk postmark" width={1241} height={1754} className="w-full h-auto rounded-xl border border-line" />
          </Tile>
          <Tile className="md:col-span-7" icon={<Mail01 size={17} />} name="The DNS request" note="To whoever manages DNS: each record, copy-safe">
            <div className="h-[330px] overflow-hidden rounded-xl border border-line bg-wash">
              <Image src="/landing/request.png" alt="Email: 2 DNS records to add for getrevlio.com, with type, host and value" width={760} height={900} className="w-full h-auto" />
            </div>
          </Tile>
          <Tile className="md:col-span-7" icon={<Image01 size={17} />} name="The card" note="1200 × 630 PNG · for the client chat or a proposal">
            <Image src="/landing/card.png" alt="Status card: SPF fix now, DKIM fix soon, DMARC fix soon" width={1200} height={630} className="w-full h-auto rounded-xl border border-line" />
          </Tile>
        </div>
      </div>
    </section>
  );
}

function Tile({ className = "", icon, name, note, children }: { className?: string; icon: ReactNode; name: string; note: string; children: ReactNode }) {
  return (
    <div className={`min-w-0 border border-line rounded-3xl p-5 md:p-6 flex flex-col gap-5 ${className}`}>
      <div className="flex items-center gap-3">
        <span className="grid place-items-center size-10 rounded-full bg-teal text-white">{icon}</span>
        <div>
          <p className="font-extrabold text-[18px] leading-tight">{name}</p>
          <p className="text-[12.5px] text-muted">{note}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

const CHECKS = [
  ["SPF", "One record, ending in -all or ~all, within the 10 DNS lookups receivers allow (includes are followed), and including the mail provider in use."],
  ["DKIM", "A signing key on the provider's selector or 20+ common ones, and its size: 1024-bit works, 2048-bit is the recommendation."],
  ["DMARC", "The policy (none, quarantine, reject), whether it covers all mail, and whether anyone receives the reports."],
  ["Mail servers", "Which provider receives mail (Google Workspace, Microsoft 365, Fastmail, Proton, Zoho), so the fixes name the right include."],
  ["MTA-STS and BIMI", "Optional extras: encrypted delivery, and a logo next to your mail."],
  ["Domains that don't send", "Judged by GOV.UK's guidance: SPF -all, DMARC reject, an empty DKIM key and a null MX, so nobody can spoof them."],
];

function Checks() {
  return (
    <section className="border-b border-line bg-wash">
      <div className={`${WRAP} py-20 md:py-28`}>
        <Head n="05" eyebrow="What it checks" title="Everything a receiver looks at." />
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CHECKS.map(([t, d]) => (
            <div key={t} className="bg-paper border border-line rounded-2xl p-6">
              <p className="font-extrabold text-[19px]">{t}</p>
              <p className="mt-2 text-[14.5px] text-ink-2 leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FAQ = [
  ["Where does the DNS come from?", "Your browser asks Google Public DNS over HTTPS (dns.google), and Cloudflare's if Google doesn't answer. The answers are public: anyone can look them up. Nothing is stored."],
  ["Why might DKIM show as not found when it's set up?", "A DKIM key lives under a selector name, and providers can pick any name. Inboxed tries the provider's own selector and 20+ common ones. If yours uses another (Google's own domain uses date-style names), add it and check again. That's why a missing key is a warning, not a failure."],
  ["Is p=none bad?", "It's the right first step: it starts the reports without affecting delivery. But on its own it doesn't stop spoofing, so the report suggests moving to quarantine once the reports show your real mail passes."],
  ["Does it send email or touch DNS?", "No. It only reads public records. Making the changes stays with whoever manages the domain, which is what the DNS request email is for."],
  ["What if the domain uses several services to send?", "The SPF suggestion includes the mail provider Inboxed can see from the MX records. Add an include: for every other service that sends as the domain (newsletters, invoicing, support tools), and check again."],
  ["Why check a domain that never sends email?", "Because anyone can still send mail that claims to come from it. GOV.UK's guidance for those domains is four records, and the report writes them for you."],
  ["Can I run it in CI?", "The outputs are Hyper Elements templates. npm run reports renders the PDF, the email and the card from a JSON file with the Hyper Elements command line tool."],
] as const;

function Faq() {
  return (
    <section id="faq" className="border-b border-line">
      <div className={`${WRAP} py-20 md:py-28 grid md:grid-cols-[360px_1fr] gap-12`}>
        <div className="md:sticky md:top-28 self-start">
          <Head n="06" eyebrow="FAQ" title="Questions from the post room." />
        </div>
        <div className="border-t border-line">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group border-b border-line">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 font-bold text-[18px]">
                {q}
                <span className="grid place-items-center size-8 shrink-0 rounded-full border-2 border-teal text-teal text-[17px] transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="pb-6 pr-12 text-[15.5px] text-ink-2 leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Close() {
  return (
    <>
      <section className="bg-teal text-white">
        <div className="h-2 airmail" aria-hidden="true" />
        <div className={`${WRAP} py-20 md:py-24 grid md:grid-cols-[1fr_auto] gap-8 items-end`}>
          <div>
            <h2 className="font-extrabold text-[40px] md:text-[64px] leading-[0.98] tracking-[-0.03em] max-w-[760px]">Find out before the bounces do.</h2>
            <p className="mt-4 text-[17px] text-white/75 max-w-[520px]">Check a client&apos;s domain, or your own.</p>
          </div>
          <Link href="/check" className="btn bg-white text-teal hover:bg-white/90 !px-6 !py-3.5 !text-[15px]">
            Check a domain <ArrowRight size={17} />
          </Link>
        </div>
      </section>
      <footer className={`${WRAP} py-10 flex flex-col md:flex-row gap-3 justify-between text-[13px] text-muted`}>
        <span className="flex items-center gap-2 font-extrabold text-[18px] text-ink">
          <Mark size={22} /> Inboxed
        </span>
        <p className="max-w-[720px] md:text-right">
          Built with{" "}
          <a className="underline underline-offset-2 hover:text-ink inline-flex items-center gap-0.5" href="https://github.com/hyper-elements/hyper-elements">
            Hyper Elements <ArrowUpRight size={12} />
          </a>
          . Not affiliated with Google, GOV.UK or any provider named. The sample domains belong to the author; &ldquo;Kestrel Web Studio&rdquo; is made up.
        </p>
      </footer>
    </>
  );
}

function Head({ n, eyebrow, title, children }: { n: string; eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="max-w-[780px]">
      <p className="tag">
        <span className="text-teal font-bold">{n}</span> · {eyebrow}
      </p>
      <h2 className="mt-4 font-extrabold text-[36px] md:text-[52px] leading-[1.03] tracking-[-0.03em]">{title}</h2>
      {children ? <p className="mt-5 text-[17px] leading-relaxed text-ink-2">{children}</p> : null}
    </div>
  );
}
