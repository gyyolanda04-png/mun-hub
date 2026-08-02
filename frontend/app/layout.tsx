import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next"
import { Geist, Source_Serif_4 } from "next/font/google"
import { AuthProvider } from "@/lib/auth"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
})

export const metadata: Metadata = {
  title: "MUN Hub — Committee Management & Debate Assistant",
  description:
    "Manage Model UN committees: import delegates, track speeches, amendments and POIs, calculate debate timing, run presentation mode, and export statistics.",
  generator: "v0.app",
}

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#2f4a8f",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`light bg-background ${geistSans.variable} ${sourceSerif.variable}`}
    >
      <body className="antialiased font-sans">
        <AuthProvider>{children}</AuthProvider>
        <Toaster position="top-center" richColors />
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
