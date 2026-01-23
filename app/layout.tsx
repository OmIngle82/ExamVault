import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "./context/ToastContext";

export const metadata: Metadata = {
  title: "ExamVault | Future of Assessment",
  description: "Advanced timed testing platform with automated scheduling.",
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
