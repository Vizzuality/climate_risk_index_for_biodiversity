import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";

import "@fontsource/red-hat-display/400.css";
import "@fontsource/red-hat-display/500.css";
import "@fontsource/red-hat-display/600.css";
import "@fontsource/red-hat-display/900.css";
import appCss from "@/styles/globals.css?url";

import { QueryProvider } from "@/providers/react-query";
import { NotFound } from "@/components/not-found";
import { rootSearch } from "@/store";

export const Route = createRootRoute({
  ...rootSearch,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Climate Risk Index for Biodiversity | CRIB" },
      { name: "description", content: "[TBD]" },
      { name: "apple-mobile-web-app-title", content: "CRIB" },
    ],
    links: [
      { rel: "icon", type: "image/png", href: "/favicon-96x96.png", sizes: "96x96" },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "shortcut icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/site.webmanifest" },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFound,
});

function RootComponent() {
  return (
    <RootDocument>
      <QueryProvider>
        <Outlet />
      </QueryProvider>
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
