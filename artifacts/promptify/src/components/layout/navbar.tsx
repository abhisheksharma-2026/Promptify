import { useAuth, useUser, useClerk } from "@clerk/react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sparkles, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Sidebar from "./sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Navbar() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-4">
        {isSignedIn && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 border-r-border bg-card">
              <Sidebar />
            </SheetContent>
          </Sheet>
        )}
        
        {!isSignedIn && (
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30 group-hover:bg-primary/30 transition-colors">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              Promptify
            </span>
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4">
        {isSignedIn ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full border border-border/50 hover:border-primary/50 transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {user?.firstName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-card border-border" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-foreground">{user?.fullName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.primaryEmailAddress?.emailAddress}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem className="focus:bg-white/5 cursor-pointer text-muted-foreground focus:text-foreground">
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="focus:bg-white/5 cursor-pointer text-muted-foreground focus:text-foreground">
                Billing
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem 
                className="focus:bg-destructive/10 cursor-pointer text-destructive focus:text-destructive"
                onClick={() => signOut({ redirectUrl: "/" })}
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/sign-in">
              <Button variant="ghost" className="text-muted-foreground hover:text-white hover:bg-white/5">
                Sign in
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_-5px_rgba(147,51,234,0.5)]">
                Get Started
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}