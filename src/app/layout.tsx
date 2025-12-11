import type { Metadata } from "next";
import { Orbitron, Rajdhani } from "next/font/google";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  weight: ["400", "700", "900"]
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  variable: "--font-rajdhani",
  weight: ["300", "400", "500", "600", "700"]
});

export const metadata: Metadata = {
  title: "Don't Bluff Me",
  description: "Authentic perspectives, genuine insights. No bluffing, just real talk.",
  keywords: ["Don't Bluff Me", "poker", "authentic", "insights", "genuine"],
  authors: [{ name: "Don't Bluff Me" }],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Don't Bluff Me",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body className={`${orbitron.variable} ${rajdhani.variable} antialiased min-h-screen bg-white font-sans`}>
        <noscript>
          <div style={{padding: '20px', textAlign: 'center'}}>
            <h1>Don't Bluff Me</h1>
            <p>This application requires JavaScript to function properly.</p>
          </div>
        </noscript>
        <div className="relative min-h-screen">
          {/* 白色背景效果 */}
          <div className="fixed inset-0 bg-gradient-to-br from-white via-gray-50 to-white -z-10" />
          <div className="fixed inset-0 opacity-20 -z-10">
            {/* CSS网格背景 */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ddd_1px,transparent_1px),linear-gradient(to_bottom,#ddd_1px,transparent_1px)] bg-[size:50px_50px]" />
          </div>
          
          {/* 主要内容 */}
          {children}
        </div>
      </body>
    </html>
  );
}
