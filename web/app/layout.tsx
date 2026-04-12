import type { Metadata, Viewport } from "next";
import { Geist_Mono, Manrope, Syne } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { InitialLoader } from "@/components/InitialLoader";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

/** React Bits–style display + body pairing (Syne / Manrope). */
const fontBitsDisplay = Syne({
  variable: "--font-bits-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const fontBitsBody = Manrope({
  variable: "--font-bits-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smart Login Portal",
  description: "Sign in to access orders, inventory, trips, and reports.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#060010",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${fontBitsDisplay.variable} ${fontBitsBody.variable} ${geistMono.variable} min-h-[100dvh] bg-background font-sans text-foreground antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            <InitialLoader>{children}</InitialLoader>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
