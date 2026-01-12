// Sidebar item component
export default function SidebarItem({ label, icon, href }: { label: string; icon?: React.ReactNode; href: string }) {
  return (
    <a href={href} className="flex items-center gap-2 p-2 hover:bg-muted">
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </a>
  );
}
