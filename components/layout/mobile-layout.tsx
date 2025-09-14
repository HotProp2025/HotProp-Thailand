import { ReactNode } from "react";
import Header from "./header";
import BottomNavigation from "./bottom-navigation";

interface MobileLayoutProps {
  children: ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative">
      <Header />
      <main className="pb-20">
        {children}
      </main>
      <BottomNavigation />
    </div>
  );
}
