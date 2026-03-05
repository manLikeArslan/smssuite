import type { Metadata } from "next";
import { Host_Grotesk } from "next/font/google";

import "./globals.css";
import { BottomNav } from "@/components/ui/BottomNav";
import { SideNav } from "@/components/ui/SideNav";

export const metadata: Metadata = {
  title: "SMS Manager",
  description: "Simple bulk SMS messaging",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SMS Manager",
  },
};

const hostGrotesk = Host_Grotesk({
  subsets: ["latin"],
  variable: "--font-host-grotesk",
  weight: ["300", "400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={hostGrotesk.variable}>
      <body
        className="antialiased min-h-[100dvh] bg-background text-foreground font-sans"
        suppressHydrationWarning
      >

        <div className="flex min-h-[100dvh]">
          <SideNav />
          <main className="flex-1 w-full bg-background relative pb-24 lg:pb-0">
            <div className="mx-auto w-full max-w-7xl">
              {children}
            </div>
            <BottomNav />
          </main>
        </div>
      </body>
    </html>
  );
}
