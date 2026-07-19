import type { Metadata } from "next";
import "./globals.css";
import "./ui.css";

export const metadata: Metadata = {
  title: "SIRAYA - Yayasan Al Basyariah",
  description: "Sistem Manajemen Keuangan Al Basyariah",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
