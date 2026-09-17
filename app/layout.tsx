import type { Metadata } from "next";
import "./globals.css";

const SITE = "https://matthew-kuan-portfolio.vercel.app";
const TITLE = "Matthew Kuan | Engineering & Maths";
const DESCRIPTION =
  "Biomedical Engineering & Applied Mathematics student at Stony Brook University, minoring in Finance. I build software and quantitative models that turn messy data into decisions, from investment return engines to full-stack AI web apps.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "Matthew Kuan",
    "Biomedical Engineering",
    "Software Engineer",
    "Quantitative Finance",
    "Applied Mathematics",
    "Stony Brook University",
    "Full-Stack Developer",
    "Microfluidics",
    "Data Science",
    "Portfolio",
  ],
  authors: [{ name: "Matthew Kuan" }],
  creator: "Matthew Kuan",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE,
    siteName: "Matthew Kuan",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Matthew Kuan | Engineering & Maths",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

// Applies the saved theme before first paint so the page never flashes the
// wrong colors. Light is the deliberate default for first-time visitors, so we
// only go dark if the visitor has explicitly chosen it before.
const NO_FLASH = `
(function(){try{
  if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark');
  }
}catch(e){}})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH }} />
      </head>
      <body className="antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-white focus:shadow-lg"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
