
import { useAuth } from "@/contexts/auth-context";
import { sidebarConfig } from "@/config/sidebar";
import { NavMain } from "@/components/shared/nav-main";
import { NavUser } from "@/components/shared/nav-user";
import { Separator } from "@/components/ui/separator";

export default function AppSidebar() {
  const { profile } = useAuth();
  // Determine role for sidebar (default to admin if not logged in)
  const role = (profile?.role || "admin") as keyof typeof sidebarConfig;
  const navItems = sidebarConfig[role] || sidebarConfig["admin"];

  return (
    <aside className="flex flex-col h-full w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 pb-2 text-lg font-bold">Admin Dashboard</div>
        <NavMain items={navItems} />
      </div>
      <Separator className="my-2" />
      <div className="p-4">
        {/* Show user menu if logged in, otherwise show login link */}
        {profile ? (
          <NavUser user={profile} />
        ) : (
          <a href="/login" className="block text-sm text-muted-foreground hover:text-foreground">Login</a>
        )}
      </div>
    </aside>
  );
}
