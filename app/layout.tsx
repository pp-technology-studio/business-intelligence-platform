import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

const title = "Signal Intelligence | P&P Technology Studio";
const description =
  "A functional Business Intelligence and data pipeline demonstration using explicitly fictional sample data.";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host?.includes("localhost") ? "http" : "https");
  const origin = host ? `${protocol}://${host}` : "http://localhost:3000";
  const imageUrl = `${origin}/og.png`;

  return {
    title,
    description,
    applicationName: "Signal Intelligence",
    icons: { icon: "/favicon.png", shortcut: "/favicon.png" },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1731,
          height: 909,
          alt: "Signal Intelligence business intelligence and data pipeline demonstration",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
