import type { Metadata } from "next";
import "./globals.css";
import { inter } from "./fonts";
import AuthBootstrap from "@/components/auth/auth-bootstrap";
// Removed global security alert providers; alerts are now scoped to the login page only

export const metadata: Metadata = {
  title: "BLOOD NODE",
  description: "A website for managing your blood network",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body>
        {/* Invisible auth bootstrap to keep user signed in across refreshes */}
        <AuthBootstrap />
        {children}
      </body>
    </html>
  );
}
