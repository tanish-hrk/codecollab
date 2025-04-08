"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { useRouter, useParams } from "next/navigation"
import { PlusIcon, Share2Icon } from "lucide-react"
import { ProjectChat } from "@/components/chat/ProjectChat"
import { CodeEditor } from "@/components/editor/CodeEditor"

interface Project {
  id: string
  name: string
  description: string
  language: string
  shareCode: string
  createdAt: string
  updatedAt: string
  owner: {
    id: string
    name: string
    image: string
  }
  isOwned: boolean
  collaborators: {
    id: string
    name: string
    image: string
    role: string
    online: boolean
  }[]
}

interface File {
  id: string
  name: string
  content: string
  language: string
  projectId: string
  createdAt: string
  updatedAt: string
}

export default function ProjectPage() {
  const router = useRouter()
  const params = useParams()
  const [isLoading, setIsLoading] = useState(true)
  const [project, setProject] = useState<Project | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [files, setFiles] = useState<File[]>([])

  useEffect(() => {
    let isMounted = true

    async function fetchProject() {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch project details
        const response = await fetch(`/api/projects/${params.id}`)
        if (!response.ok) {
          throw new Error(response.status === 404 ? "Project not found" : "Failed to fetch project")
        }
        const projectData = await response.json()
        if (isMounted) setProject(projectData)

        // Fetch files
        const filesResponse = await fetch(`/api/projects/${params.id}/files`)
        if (!filesResponse.ok) {
          throw new Error("Failed to fetch files")
        }
        const filesData = await filesResponse.json()
        if (isMounted) setFiles(filesData)
      } catch (error) {
        console.error("Error fetching project:", error)
        if (isMounted) {
          setError(error instanceof Error ? error.message : "An error occurred")
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchProject()

    return () => {
      isMounted = false
    }
  }, [params.id])

  const handleShareProject = () => {
    if (project) {
      navigator.clipboard.writeText(project.shareCode)
      toast({
        title: "Share Code Copied",
        description: `Share code "${project.shareCode}" copied to clipboard`,
      })
    }
  }

  const handleFileSave = async (fileId: string, content: string, language: string) => {
    try {
      const response = await fetch(`/api/projects/${params.id}/files/${fileId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, language }),
      })

      if (!response.ok) throw new Error("Failed to save file")
      
      const updatedFile = await response.json()
      setFiles(files.map(f => f.id === fileId ? { ...updatedFile, id: updatedFile._id } : f))
    } catch (error) {
      console.error("Error saving file:", error)
      throw error
    }
  }

  const handleFileCreate = async (name: string, language: string) => {
    try {
      const response = await fetch(`/api/projects/${params.id}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, language }),
      })

      if (!response.ok) throw new Error("Failed to create file")
      
      const newFile = await response.json()
      setFiles([...files, { ...newFile, id: newFile._id }])
    } catch (error) {
      console.error("Error creating file:", error)
      throw error
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center">
        <h2 className="text-2xl font-bold">Project Not Found</h2>
        <p className="text-muted-foreground">
          The project you're looking for doesn't exist or you don't have access to it.
        </p>
        <Button className="mt-4" onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold">{project.name}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{project.language}</Badge>
              <span className="text-xs text-muted-foreground">
                Updated {new Date(project.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {project.collaborators.slice(0, 3).map((collaborator) => (
              <div key={collaborator.id} className="relative">
                <Avatar className="h-8 w-8 border-2 border-background">
                  <AvatarImage
                    src={collaborator.image || `/placeholder.svg?height=32&width=32`}
                    alt={collaborator.name}
                  />
                  <AvatarFallback>{collaborator.name.charAt(0)}</AvatarFallback>
                </Avatar>
                {collaborator.online && (
                  <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-1 ring-white" />
                )}
              </div>
            ))}
            {project.collaborators.length > 3 && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs">
                +{project.collaborators.length - 3}
              </div>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={handleShareProject}>
            <Share2Icon className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button size="sm">
            <PlusIcon className="mr-2 h-4 w-4" />
            Add File
          </Button>
        </div>
      </div>
      <div className="grid flex-1 grid-cols-[1fr,320px] overflow-hidden">
        <div className="flex flex-col overflow-hidden">
          <CodeEditor
            files={files}
            onSave={handleFileSave}
            onCreate={handleFileCreate}
            className="flex-1 overflow-hidden"
          />
        </div>
        <div className="border-l overflow-hidden">
          <ProjectChat projectId={params.id as string} />
        </div>
      </div>
    </div>
  )
}

