import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "./_components/Sidebar";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LMS Teacher",
  description: "Grade and Monitor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        suppressHydrationWarning
        lang="en"
        className={`${inter.className} h-full antialiased`}
      >
        <body className="min-h-screen bg-[#f0f4f8]">
          <Sidebar />

          {/* Sidebar-н зай үлдээгээд, үлдсэн хэсгийн дотор main-аа 1440px төвлөрүүлнэ */}
          <div className="min-h-screen pl-[220px]">
            <main className="w-full max-w-[1440px] mx-auto flex flex-col">
              {children}
            </main>
          </div>

          <Toaster position="top-center" />
        </body>
      </html>
    </ClerkProvider>
  );
}
