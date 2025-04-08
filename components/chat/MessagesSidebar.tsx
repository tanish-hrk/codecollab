"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"

interface Project {
  id: string
  name: string
  lastMessage?: {
    content: string
    sender: {
      name: string
      image?: string
    }
    timestamp: string
  }
}

export function MessagesSidebar() {
  const { data: session } = useSession()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchProjects()
    const interval = setInterval(fetchProjects, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchProjects = async () => {
    if (!session?.user) return

    try {
      const response = await fetch("/api/projects/messages")
      if (!response.ok) throw new Error("Failed to fetch projects")
      const data = await response.json()
      setProjects(data)
    } catch (error) {
      console.error("Error fetching projects:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProjectClick = (projectId: string) => {
    setSelectedProjectId(projectId)
    router.push(`/project/${projectId}`)
  }

  if (isLoading) {
    return (
      <Card className="h-full p-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="h-10 w-10 rounded-full bg-muted" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Messages</h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {projects.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No project messages yet
            </div>
          ) : (
            projects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleProjectClick(project.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  project.id === selectedProjectId
                    ? "bg-primary/10"
                    : "hover:bg-muted"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {project.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium truncate">{project.name}</h3>
                      {project.lastMessage && (
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(project.lastMessage.timestamp), {
                            addSuffix: true,
                          })}
                        </span>
                      )}
                    </div>
                    {project.lastMessage && (
                      <div className="mt-1">
                        <p className="text-sm text-muted-foreground truncate">
                          <span className="font-medium">
                            {project.lastMessage.sender.name}:
                          </span>{" "}
                          {project.lastMessage.content}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  )
} 