import {
  ClientOnly,
  createRootRoute,
  HeadContent,
  Outlet,
  retainSearchParams,
  Scripts,
} from "@tanstack/react-router";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";

import "@fontsource/red-hat-display/400.css";
import "@fontsource/red-hat-display/500.css";
import "@fontsource/red-hat-display/600.css";
import "@fontsource/red-hat-display/900.css";
import appCss from "@/styles/globals.css?url";

import { Sidebar, SidebarContent, SidebarProvider } from "@/components/ui/sidebar";
import { QueryProvider } from "@/providers/react-query";
import { MapProvider } from "@/providers/map";
import Navigation from "@/components/navigation";
import MapView from "@/components/map";
import ScenarioToggle from "@/components/scenario-toggle";
import LayerManager from "@/containers/map/layer-manager";

export const Route = createRootRoute({
  search: {
    middlewares: [retainSearchParams(true)],
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Climate Risk Index for Biodiversity | CRIB" },
      { name: "description", content: "[TBD]" },
    ],
    links: [
      { rel: "icon", href: "/favicon.ico" },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <NuqsAdapter>
        <SidebarProvider>
          <QueryProvider>
            <MapProvider>
              <div className="absolute h-full">
                <Navigation />
                <Sidebar className="left-[5.125rem]">
                  <SidebarContent>
                    <Outlet />
                  </SidebarContent>
                </Sidebar>
              </div>
              <div className="h-screen w-full">
                <ClientOnly fallback={null}>
                  <MapView>
                    <ScenarioToggle />
                    <LayerManager />
                  </MapView>
                </ClientOnly>
              </div>
            </MapProvider>
          </QueryProvider>
        </SidebarProvider>
      </NuqsAdapter>
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="antialiased font-sans">
        {children}
        <Scripts />
      </body>
    </html>
  );
}
