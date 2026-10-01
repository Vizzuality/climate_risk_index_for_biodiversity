import { ClientOnly, createFileRoute, Outlet } from "@tanstack/react-router";

import { Sidebar, SidebarContent, SidebarProvider } from "@/components/ui/sidebar";
import { MapProvider } from "@/providers/map";
import Navigation from "@/components/navigation";
import { MapView } from "@/components/map";
import ScenarioToggle from "@/components/scenario-toggle";
import LayerManager from "@/containers/map/layer-manager";

export const Route = createFileRoute("/_dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <SidebarProvider>
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
    </SidebarProvider>
  );
}
