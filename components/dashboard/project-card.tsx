import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface ProjectCardProps {
  project: {
    id: string
    name: string
    description: string
    language: string
    lastUpdated: string
    collaborators: number
    active: boolean
  }
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/dashboard/projects/${project.id}`}>
      <Card className="h-full transition-all hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="line-clamp-1">{project.name}</CardTitle>
            {project.active && (
              <div className="flex h-2 w-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{project.language}</Badge>
            <span className="text-xs text-muted-foreground">Updated {project.lastUpdated}</span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
        </CardContent>
        <CardFooter>
          <div className="flex items-center justify-between w-full">
            <div className="flex -space-x-2">
              {Array.from({ length: Math.min(3, project.collaborators) }).map((_, i) => (
                <Avatar key={i} className="h-6 w-6 border-2 border-background">
                  <AvatarFallback className="text-xs">{String.fromCharCode(65 + i)}</AvatarFallback>
                </Avatar>
              ))}
              {project.collaborators > 3 && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-xs">
                  +{project.collaborators - 3}
                </div>
              )}
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}

