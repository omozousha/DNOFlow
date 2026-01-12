import { ShieldCheck, Home, FileText, Briefcase, User } from 'lucide-react';

export const sidebarConfig = {
  admin: [
    { title: "Dashboard", href: "/admin", icon: Home },
    { title: "Users Management", href: "/admin/users", icon: ShieldCheck },
    { title: "System Settings", href: "/admin/settings", icon: ShieldCheck },
    { title: "Account", href: "/account", icon: User },
  ],
  owner: [
    { title: "Dashboard FTTH", href: "/owner/ftth", icon: Home },
    { title: "Dashboard Backbone", href: "/owner/backbone", icon: Home },
    { title: "Account", href: "/account", icon: User },
  ],
  controller: [
    { title: "Dashboard", href: "/controller", icon: Home },
    { title: "Worksheet", href: "/controller/worksheet", icon: FileText },
    { title: "Projects", href: "/controller/projects", icon: Briefcase },
    { title: "Account", href: "/account", icon: User },
  ],
};