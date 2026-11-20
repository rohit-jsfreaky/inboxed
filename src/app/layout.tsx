import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const sans = localFont({
  src: [
    { path: "../../fonts/HankenGrotesk-400.woff", weight: "400" },
    { path: "../../fonts/HankenGrotesk-500.woff", weight: "500" },
    { path: "../../fonts/HankenGrotesk-600.woff", weight: "600" },
    { path: "../../fonts/HankenGrotesk-700.woff", weight: "700" },
    { path: "../../fonts/HankenGrotesk-800.woff", weight: "800" },
  ],
  variable: "--font-hanken",
});
const mono = localFont({ src: [{ path: "../../fonts/FragmentMono-400.woff", weight: "400" }], variable: "--font-fragment" });

export const metadata: Metadata = {
  title: "Inboxed · Is this domain's email set up to land in the inbox?",
  description:
    "Type a domain. Inboxed checks SPF, DKIM and DMARC against Gmail's sender rules, then writes the client report, the exact DNS records to add, and a status card. Built with Hyper Elements.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
