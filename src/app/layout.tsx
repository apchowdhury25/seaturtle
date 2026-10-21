import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { CookieNotice } from "@/components/cookie-notice";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://seaturtleapparel.com"),
  title: { default: "Sea Turtle Apparel", template: "%s · Sea Turtle Apparel" },
  description: "Premium clothing with a commitment to responsible sourcing, traceable manufacturing, and healthier oceans.",
  applicationName: "Sea Turtle Apparel",
  openGraph: {
    siteName: "Sea Turtle Apparel",
    type: "website",
    title: "Sea Turtle Apparel",
    description: "Wear the Change. Protect Our Oceans.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${fraunces.variable} h-full`}>
      <body className="min-h-full overflow-x-clip bg-ivory font-sans text-charcoal antialiased">
        <a href="#content" className="skip-link">Skip to content</a>
        {children}
        <CookieNotice />
      </body>
    </html>
  );
}
