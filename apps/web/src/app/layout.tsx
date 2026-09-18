import type { Metadata } from "next";
import { Geist, Source_Serif_4 } from "next/font/google";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
});

export const metadata: Metadata = {
  title: "ATS Genie — ATS-ready resumes that parse better",
  description:
    "Generate ATS-ready resumes that parse better. Nothing is stored. Processing uses an open-weight model that is not trained on your data.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${sourceSerif.variable} min-h-screen font-sans antialiased`}>
        <Providers>
          <SiteHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
