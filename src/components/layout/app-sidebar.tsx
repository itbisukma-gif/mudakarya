
"use client";

import {
  Car,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Settings,
  Wallet,
  Star,
  Wand2,
  Moon,
  Sun,
  Loader2,
  User
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/icons";
import { UserNav } from "./user-nav";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/armada", label: "Armada", icon: Car },
  { href: "/dashboard/keuangan", label: "Keuangan", icon: Wallet },
  { href: "/dashboard/orders", label: "List Order", icon: ClipboardList },
  { href: "/dashboard/promosi", label: "Promosi", icon: Wand2 },
  { href: "/dashboard/testimoni", label: "Testimoni", icon: Star },
  { href: "/dashboard/pengaturan", label: "Pengaturan", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const ThemeIcon = !mounted ? Loader2 : theme === 'dark' ? Sun : Moon;
  const themeTooltip = !mounted ? 'Loading theme...' : theme === 'dark' ? 'Light Mode' : 'Dark Mode';

  return (
    <Sidebar
      className="border-r bg-sidebar text-sidebar-foreground"
      variant="sidebar"
      collapsible="icon"
    >
      <SidebarHeader className="p-4 h-14 flex items-center">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Logo className="w-7 h-7 text-primary" />
          <span className="text-lg font-bold tracking-tight">
            MudaKarya RentCar
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href)}
                tooltip={{ children: item.label }}
                className="justify-start data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:shadow-md hover:bg-primary/90 hover:text-primary-foreground"
              >
                <Link href={item.href}>
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 mt-auto">
        <div className="md:hidden mb-2">
            <UserNav />
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={toggleTheme} 
              tooltip={{ children: themeTooltip }} 
              className="justify-start hover:bg-accent hover:text-accent-foreground"
              disabled={!mounted}
            >
              <ThemeIcon className={`h-5 w-5 ${!mounted ? 'animate-spin' : ''}`}/>
              <span>{mounted ? (theme === 'dark' ? 'Light Mode' : 'Dark Mode') : 'Loading...'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
