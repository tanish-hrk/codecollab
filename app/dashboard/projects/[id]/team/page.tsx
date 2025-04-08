"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "@/components/ui/use-toast"

interface Collaborator {
  id: string
  name: string
  email: string
  image: string
  role: string
  online: boolean
}

export default function TeamPage() {
  const params = useParams()
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [shareCode, setShareCode] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchTeam() {
      try {
        const response = await fetch(`/api/projects/${params.id}/team`)
        if (!response.ok) {
          throw new Error("Failed to fetch team")
        }
        const data = await response.json()
        setCollaborators(data.collaborators)
        setShareCode(data.shareCode)
      } catch (error) {
        console.error("Error fetching team:", error)
        toast({
          title: "Error",
          description: "Failed to load team members",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchTeam()
  }, [params.id])

  const handleInvite = async (email: string) => {
    try {
      const response = await fetch(`/api/projects/${params.id}/team/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        throw new Error("Failed to invite user")
      }

      const newCollaborator = await response.json()
      setCollaborators(prev => [...prev, newCollaborator])
      toast({
        title: "Success",
        description: "User invited successfully",
      })
    } catch (error) {
      console.error("Error inviting user:", error)
      toast({
        title: "Error",
        description: "Failed to invite user",
        variant: "destructive",
      })
    }
  }

  const handleRemove = async (userId: string) => {
    try {
      const response = await fetch(`/api/projects/${params.id}/team/${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to remove user")
      }

      setCollaborators(prev => prev.filter(c => c.id !== userId))
      toast({
        title: "Success",
        description: "User removed successfully",
      })
    } catch (error) {
      console.error("Error removing user:", error)
      toast({
        title: "Error",
        description: "Failed to remove user",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Team Management</h1>
        <div className="flex items-center gap-4">
          <Input
            placeholder="Enter email to invite"
            className="max-w-md"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const input = e.target as HTMLInputElement
                handleInvite(input.value)
                input.value = ""
              }
            }}
          />
          <Button>Invite</Button>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Share Code</h2>
        <div className="flex items-center gap-4">
          <Input value={shareCode} readOnly className="max-w-md" />
          <Button
            onClick={() => {
              navigator.clipboard.writeText(shareCode)
              toast({
                title: "Copied",
                description: "Share code copied to clipboard",
              })
            }}
          >
            Copy
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Team Members</h2>
        <div className="space-y-4">
          {collaborators.map((collaborator) => (
            <div
              key={collaborator.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={collaborator.image} alt={collaborator.name} />
                  <AvatarFallback>{collaborator.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{collaborator.name}</p>
                  <p className="text-sm text-muted-foreground">{collaborator.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">{collaborator.role}</span>
                <span
                  className={`h-2 w-2 rounded-full ${
                    collaborator.online ? "bg-green-500" : "bg-gray-500"
                  }`}
                />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemove(collaborator.id)}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 