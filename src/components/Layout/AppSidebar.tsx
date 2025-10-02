import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Microscope,
  Pill,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/" },
  { title: "Patients", icon: Users, path: "/patients" },
  { title: "Appointments", icon: Calendar, path: "/appointments" },
  { title: "Dermascopy", icon: Microscope, path: "/dermascopy" },
  { title: "Treatments", icon: Pill, path: "/treatments" },
  { title: "Settings", icon: Settings, path: "/settings" },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <h2 className="text-xl font-bold text-sidebar-primary">Hair Clinic</h2>
        <p className="text-xs text-muted-foreground">Management System</p>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.path}
                  >
                    <Link to={item.path}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
