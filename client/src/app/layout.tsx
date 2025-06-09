import type { Metadata } from "next";
import { Red_Hat_Display } from "next/font/google";
import "./globals.css";
import {
  Sidebar,
  SidebarContent,
  SidebarProvider,
} from "@/components/ui/sidebar";
import QueryProvider from "@/app/react-query-provider";
import MapProvider from "@/app/map-provider";
import Navigation from "@/components/navigation";
import Map from "@/components/map";

const redHatDisplay = Red_Hat_Display({
  variable: "--font-red-hat-display",
  subsets: ["latin"],
  weight: ["400", "500", "900"],
});

export const metadata: Metadata = {
  title: "Climate Risk Index for Biodiversity | CRIB",
  description: "[TBD]",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${redHatDisplay.variable} antialiased font-sans`}>
        <SidebarProvider>
          <QueryProvider>
            <MapProvider>
              <div className="absolute h-full">
                <Navigation />
                <Sidebar className="left-[5.125rem]">
                  <SidebarContent>{children}</SidebarContent>
                </Sidebar>
              </div>
              <div className="h-screen w-full">
                <Map />
              </div>
            </MapProvider>
          </QueryProvider>
        </SidebarProvider>
      </body>
    </html>
  );
}
