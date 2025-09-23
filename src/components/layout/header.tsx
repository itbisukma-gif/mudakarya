
'use client'

import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserNav } from "./user-nav";
import { cn } from "@/lib/utils";

export function Header() {
  return (
    <header className={cn("sticky top-0 z-30 h-14 border-b bg-background/80 backdrop-blur-sm")}>
        <div className="h-full w-full flex items-center gap-4 px-4 sm:px-6">
            <SidebarTrigger className="md:hidden -ml-2" />
            <div className="hidden items-center gap-2 md:flex">
                {/* This is a placeholder for a title or breadcrumbs if needed */}
            </div>
            
            <div className="ml-auto">
                <UserNav />
            </div>
        </div>
    </header>
  );
}
