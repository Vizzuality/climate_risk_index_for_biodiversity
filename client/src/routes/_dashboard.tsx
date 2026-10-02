import { ClientOnly, createFileRoute, Outlet } from "@tanstack/react-router";

import { Sidebar, SidebarContent, SidebarProvider } from "@/components/ui/sidebar";
import { MapProvider } from "@/providers/map";
import Navigation from "@/components/navigation";
import { MapView } from "@/components/map";
import ScenarioToggle from "@/components/scenario-toggle";
import LayerManager from "@/containers/map/layer-manager";
import { ContextualLayersPanel, useSidebarToggleClassName } from "@/containers/contextual-layers";

export const Route = createFileRoute("/_dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <SidebarProvider>
      <MapProvider>
        <div className="absolute h-full">
          <Navigation />
          <DashboardSidebar>
            <Outlet />
          </DashboardSidebar>
        </div>
        <ContextualLayersPanel />
        <div className="h-screen w-full">
          <ClientOnly fallback={null}>
            <MapView>
              <ScenarioToggle />
              <LayerManager />
            </MapView>
          </ClientOnly>
        </div>
      </MapProvider>
    </SidebarProvider>
  );
}

// Its own component so toggling the contextual layers panel doesn't re-render the map.
function DashboardSidebar({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Sidebar className="left-[5.125rem]" toggleClassName={useSidebarToggleClassName()}>
      <SidebarContent>{children}</SidebarContent>
    </Sidebar>
  );
}
