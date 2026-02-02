import type React from "react";
import { RootProvider } from "fumadocs-ui/provider/next";
import "./global.css";
import { Chivo_Mono } from "next/font/google";

const chivoMono = Chivo_Mono({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={chivoMono.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
