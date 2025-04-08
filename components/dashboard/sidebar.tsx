"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Home, FolderGit2, Users, Settings, HelpCircle, PlusCircle } from "lucide-react"

interface SidebarProps {
  isMobile?: boolean
}

export default function DashboardSidebar({ isMobile }: SidebarProps) {
  const pathname = usePathname()

  const routes = [
    {
      label: "Dashboard",
      icon: Home,
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      label: "Projects",
      icon: FolderGit2,
      href: "/dashboard/projects",
      active: pathname === "/dashboard/projects" || pathname.startsWith("/dashboard/projects/"),
    },
    {
      label: "Team",
      icon: Users,
      href: "/dashboard/team",
      active: pathname === "/dashboard/team",
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/dashboard/settings",
      active: pathname === "/dashboard/settings",
    },
    {
      label: "Help",
      icon: HelpCircle,
      href: "/dashboard/help",
      active: pathname === "/dashboard/help",
    },
  ]

  return (
    <div className={cn("pb-12", isMobile ? "px-2 pt-6" : "hidden border-r bg-muted/40 md:block md:w-64")}>
      <ScrollArea className="h-full px-3">
        <div className="flex flex-col gap-2 py-2">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="text-lg font-semibold tracking-tight">Navigation</div>
            {!isMobile && (
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <PlusCircle className="h-4 w-4" />
                <span className="sr-only">Create</span>
              </Button>
            )}
          </div>
          <div className="space-y-1">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                  route.active ? "bg-accent text-accent-foreground" : "transparent",
                )}
              >
                <route.icon className="h-4 w-4" />
                {route.label}
              </Link>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

