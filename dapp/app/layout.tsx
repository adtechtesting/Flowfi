import type { Metadata } from "next";
import { Barlow, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Providers } from "./components/providers";
import { Navbar } from "./components/Navbar";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FlowFi | Global Work Payments",
  description: "Programmable Global Work Payments System",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Providers>
        <body
          suppressHydrationWarning
          className={`${barlow.variable} ${instrumentSerif.variable} antialiased`}
        >
          <Navbar />
          {children}
        </body>
      </Providers>
    </html>
  );
}
