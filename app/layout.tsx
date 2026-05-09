import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clinical Note Co-pilot",
  description:
    "Turn messy clinical transcripts into structured SOAP notes with ICD-10 suggestions, confidence indicators, and human-in-the-loop review. Available as a web app and an MCP server.",
  openGraph: {
    title: "Clinical Note Co-pilot",
    description:
      "Structured SOAP notes from transcripts, with confidence and source attribution. Web app + MCP server.",
    // Image is auto-detected from app/opengraph-image.tsx
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('theme');
                if (t === 'light') document.documentElement.classList.add('light');
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
