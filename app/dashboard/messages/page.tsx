"use client"

import { useEffect, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { ProjectChat } from "@/components/chat/ProjectChat"

interface ProjectChat {
  id: string
  projectId: string
  projectName: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  members: {
    id: string
    name: string
    image: string | null
  }[]
}

export default function MessagesPage() {
  const [projectChats, setProjectChats] = useState<ProjectChat[]>([])
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProjectChats()
  }, [])

  const fetchProjectChats = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/messages/projects")
      if (!response.ok) {
        throw new Error("Failed to fetch project chats")
      }
      const data = await response.json()
      setProjectChats(data || [])
    } catch (error) {
      console.error("Error fetching project chats:", error)
      toast.error("Failed to load project chats")
      setProjectChats([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-80 border-r">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Project Chats</h2>
        </div>
        <ScrollArea className="h-[calc(100vh-8rem)]">
          {projectChats.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No projects available
            </div>
          ) : (
            projectChats.map((chat) => (
              <div
                key={chat.id}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                  selectedProject === chat.projectId ? "bg-gray-50" : ""
                }`}
                onClick={() => setSelectedProject(chat.projectId)}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{chat.projectName}</h3>
                  {chat.unreadCount > 0 && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
                <div className="flex items-center mt-2">
                  {chat.members.map((member) => (
                    <Avatar key={member.id} className="h-6 w-6 mr-1">
                      <AvatarImage src={member.image || undefined} />
                      <AvatarFallback>{member.name[0]}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1">
        {selectedProject ? (
          <ProjectChat
            projectId={selectedProject}
            projectName={
              projectChats.find((chat) => chat.projectId === selectedProject)?.projectName || ""
            }
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Select a project to start chatting</p>
          </div>
        )}
      </div>
    </div>
  )
} 