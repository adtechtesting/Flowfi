import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { Providers } from "./components/providers";
import { Navbar } from "./components/Navbar";

const manrope = Nunito({

  weight: ["200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-manrope",
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
          className={`${manrope.variable} font-sans antialiased`}
        >
          <Navbar />
          {children}
        </body>
      </Providers>
    </html>
  );
}
