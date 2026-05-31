import { ReactNode } from "react";
import Sidebar from "./sidebar";
import Navbar from "./navbar";
import { useAuth } from "@clerk/react";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { isSignedIn } = useAuth();
  
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {isSignedIn && <Sidebar />}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}