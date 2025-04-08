"use client"

import { type ReactNode, useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import DashboardSidebar from "@/components/dashboard/sidebar"
import DashboardHeader from "@/components/dashboard/header"
import { MessagesSidebar } from "@/components/chat/MessagesSidebar"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [showMessages, setShowMessages] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't redirect in the layout component to avoid infinite loops
  // Just show loading state until session is determined
  if (!mounted || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  // If not authenticated, show a simple message
  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="mt-2 text-muted-foreground">Please log in to access the dashboard</p>
          <button
            className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground"
            onClick={() => (window.location.href = "/login")}
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader 
        onToggleMessages={() => setShowMessages(!showMessages)} 
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
      />
      <div className="flex flex-1 overflow-hidden">
        <div
          className={`w-[280px] min-w-[280px] border-r transition-all duration-300 ${
            showSidebar ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="h-full overflow-y-auto">
            <DashboardSidebar />
          </div>
        </div>
        <main 
          className={`flex-1 transition-all duration-300 ${
            !showSidebar && !showMessages ? "w-full" : ""
          }`}
        >
          {children}
        </main>
        <div
          className={`w-[320px] min-w-[320px] border-l transition-all duration-300 ${
            showMessages ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="h-full overflow-y-auto">
            <MessagesSidebar />
          </div>
        </div>
      </div>
    </div>
  )
}

