import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "./context/ToastContext";

export const metadata: Metadata = {
  title: "ExamVault | Future of Assessment",
  description: "Advanced timed testing platform with automated scheduling and AI-powered question generation.",
  applicationName: "ExamVault",
  authors: [{ name: "ExamVault Team" }],
  keywords: ["exam", "test", "assessment", "ai", "review", "education"],
  creator: "ExamVault",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://examvault.app",
    title: "ExamVault | Future of Assessment",
    description: "Advanced timed testing platform with automated scheduling.",
    siteName: "ExamVault",
  },
  twitter: {
    card: "summary_large_image",
    title: "ExamVault | Future of Assessment",
    description: "Advanced timed testing platform with automated scheduling.",
    creator: "@ExamVault",
  },
  appleWebApp: {
    capable: true,
    title: "ExamVault",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="bg-blobs">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
          <div className="blob blob-3"></div>
          <div className="blob blob-4"></div>
        </div>
        <div className="main-layout">
          <ToastProvider>
            {children}
          </ToastProvider>
        </div>
      </body>
    </html>
  );
}
