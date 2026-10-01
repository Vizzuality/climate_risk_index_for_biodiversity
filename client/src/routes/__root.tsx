import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";

import "@fontsource/red-hat-display/400.css";
import "@fontsource/red-hat-display/500.css";
import "@fontsource/red-hat-display/600.css";
import "@fontsource/red-hat-display/900.css";
import appCss from "@/styles/globals.css?url";

import { QueryProvider } from "@/providers/react-query";
import { NotFound } from "@/components/not-found";
import { scenarioSearch } from "@/store";

export const Route = createRootRoute({
  ...scenarioSearch,
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
