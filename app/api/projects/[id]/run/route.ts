import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { findOne, findFilesByProjectId } from "@/lib/db"
import { COLLECTIONS } from "@/lib/models"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { tmpdir } from "os"

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if project exists and user has access
    const project = await findOne(COLLECTIONS.PROJECTS, { _id: params.id })
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    if (project.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get all files in the project
    const files = await findFilesByProjectId(params.id)

    // Create a temporary directory for the project
    const tempDir = join(tmpdir(), `codecollab-${project._id}`)
    await mkdir(tempDir, { recursive: true })

    // Write all files to the temporary directory
    for (const file of files) {
      const filePath = join(tempDir, file.path || "", file.name)
      await mkdir(join(tempDir, file.path || ""), { recursive: true })
      await writeFile(filePath, file.content)
    }

    // For HTML projects, we can serve the files directly
    if (project.language.toLowerCase() === "html") {
      const mainFile = files.find(f => f.name === "index.html")
      if (!mainFile) {
        return NextResponse.json({ error: "No index.html file found" }, { status: 400 })
      }

      // Return the file content directly
      return NextResponse.json({ 
        url: `/api/projects/${params.id}/preview`,
        content: mainFile.content 
      })
    }

    // For other languages, we'll need to use a different approach
    // For now, we'll return a message indicating that running the project
    // requires additional setup
    return NextResponse.json({ 
      error: "Running this type of project requires additional setup. Please use an IDE or terminal to run the project locally.",
      files: files.map(f => ({
        name: f.name,
        path: f.path,
        content: f.content
      }))
    }, { status: 400 })
  } catch (error) {
    console.error("Error running project:", error)
    return NextResponse.json({ error: "Failed to run project" }, { status: 500 })
  }
} 