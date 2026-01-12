import { ReactNode } from 'react';

// Page container wrapper
interface PageContainerProps {
  children: ReactNode;
}

export default function PageContainer({ children }: PageContainerProps) {
  return <div className="max-w-7xl mx-auto px-4 py-6">{children}</div>;
}
