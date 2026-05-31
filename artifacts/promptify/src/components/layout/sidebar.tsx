import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Sparkles,
  Library,
  Star,
  LayoutTemplate,
  CreditCard,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { useAdminCheck } from "@/hooks/use-admin";

export default function Sidebar() {
  const [location] = useLocation();
  const { data: adminData } = useAdminCheck();
  const isAdmin = !!adminData?.adminUserId;

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Generate", href: "/generate", icon: Sparkles },
    { name: "Library", href: "/library", icon: Library },
    { name: "Favorites", href: "/favorites", icon: Star },
    { name: "Templates", href: "/templates", icon: LayoutTemplate },
    { name: "Pricing", href: "/pricing", icon: Zap },
    { name: "Billing", href: "/billing", icon: CreditCard },
  ];

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col hidden md:flex">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30 group-hover:bg-primary/30 transition-colors">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            Promptify
          </span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {item.name}
            </Link>
          );
        })}

        {/* Admin link — only visible to the admin user */}
        {isAdmin && (
          <div className="pt-2 mt-2 border-t border-border">
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                location === "/admin"
                  ? "bg-amber-500/10 text-amber-400 font-medium"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              <ShieldCheck
                className={cn(
                  "w-5 h-5",
                  location === "/admin"
                    ? "text-amber-400"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              Admin
            </Link>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="bg-gradient-to-br from-primary/20 to-purple-900/20 border border-primary/20 rounded-xl p-4">
          <p className="text-sm font-medium text-white mb-1">APEX Framework</p>
          <p className="text-xs text-muted-foreground mb-3">
            Upgrade for unlimited prompt generation.
          </p>
          <Link href="/pricing">
            <button className="w-full text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-md transition-colors">
              Upgrade
            </button>
          </Link>
        </div>
      </div>
    </aside>
  );
}
