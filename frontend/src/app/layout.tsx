import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Toaster } from "@/components/ui/sonner";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "نظام توزيع المدرسين والحصص",
  description: "نظام لإدارة وتوزيع المدرسين على الصفوف والشُعَب والحصص الدراسية",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${cairo.variable} font-sans antialiased`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <Header />
            <main className="flex-1 p-6 bg-muted/30">
              {children}
            </main>
          </div>
        </div>
        <Toaster position="top-center" dir="rtl" />
      </body>
    </html>
  );
}
