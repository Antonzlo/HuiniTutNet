import type { Metadata } from "next";
import { Inter, Nunito } from "next/font/google";
import "@/styles/global.scss";
import { AppShell } from "@/components/AppShell";

const nunito = Nunito({ subsets: ["latin", "cyrillic"], weight: ["700", "800"], variable: "--font-nunito" });
const inter = Inter({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "HiuniTut.net",
  description: "Приватный музыкальный сервис для своих",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${nunito.variable} ${inter.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
