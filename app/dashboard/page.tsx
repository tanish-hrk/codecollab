"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { PlusIcon, SearchIcon } from "lucide-react"
import { useSession } from "next-auth/react"

// Define the ProjectCard component
const ProjectCard = ({ project }: { project: any }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{project.name}</CardTitle>
        <CardDescription>{project.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Language: {project.language}</p>
        <p>Last Updated: {new Date(project.updatedAt).toLocaleDateString()}</p>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [projects, setProjects] = useState<any[]>([])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/projects")
        if (!response.ok) throw new Error("Failed to fetch projects")
        const data = await response.json()
        setProjects(data)
      } catch (error) {
        console.error("Error fetching projects:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (status === "authenticated") {
      fetchProjects()
    }
  }, [status])

  const handleCreateProject = () => {
    router.push("/dashboard/new-project")
  }

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.language.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const recentProjects = [...filteredProjects]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6)

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome, {session.user?.name || "User"}! Manage your projects and collaborations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">Import Project</Button>
          <Button onClick={handleCreateProject}>
            <PlusIcon className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Projects</CardTitle>
            <CardDescription>Your active and archived projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">
              {projects.length > 0 ? `${projects.length} total projects` : "No projects yet"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Active Collaborations</CardTitle>
            <CardDescription>Projects with recent activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">
              {projects.length > 0 ? `${projects.length} active projects` : "No active projects"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Team Members</CardTitle>
            <CardDescription>People you collaborate with</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No team members yet</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Your Projects</h2>
          <div className="relative w-full max-w-sm">
            <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="recent">
          <TabsList>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="all">All Projects</TabsTrigger>
            <TabsTrigger value="shared">Shared With Me</TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="mt-4">
            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : recentProjects.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recentProjects.map((project) => (
                  <ProjectCard key={project._id.toString()} project={project} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border p-8 text-center">
                <h3 className="text-lg font-semibold">No projects found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "No projects match your search criteria." : "You haven't created any projects yet."}
                </p>
                <Button onClick={handleCreateProject} className="mt-4">
                  Create Your First Project
                </Button>
              </div>
            )}
          </TabsContent>
          <TabsContent value="all" className="mt-4">
            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : filteredProjects.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredProjects.map((project) => (
                  <ProjectCard key={project._id.toString()} project={project} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border p-8 text-center">
                <h3 className="text-lg font-semibold">No projects found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "No projects match your search criteria." : "You haven't created any projects yet."}
                </p>
                <Button onClick={handleCreateProject} className="mt-4">
                  Create Your First Project
                </Button>
              </div>
            )}
          </TabsContent>
          <TabsContent value="shared" className="mt-4">
            <div className="rounded-lg border p-8 text-center">
              <h3 className="text-lg font-semibold">Shared Projects</h3>
              <p className="text-muted-foreground">Projects shared with you by others will appear here.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

