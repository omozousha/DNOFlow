// Dashboard header component
interface DashboardHeaderProps {
  title: string;
}

export default function DashboardHeader({ title }: DashboardHeaderProps) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-bold">{title}</h1>
    </header>
  );
}
