import type React from "react"
import "../app/globals.css" // Ensure global styles are imported
import ClientLayout from "./clientLayout"
import { Toaster } from "sonner"

export const metadata = {
  title: "TablEat - Restaurant Admin Dashboard",
  description: "Comprehensive restaurant management system for modern dining establishments",
  icons: {
    icon: "/favicon.ico", // path inside public/
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <ClientLayout>{children}</ClientLayout>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}

