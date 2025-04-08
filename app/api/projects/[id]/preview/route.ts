import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { findOne, findFilesByProjectId } from "@/lib/db"
import { COLLECTIONS } from "@/lib/models"

export async function GET(
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

    // Find the main HTML file
    const mainFile = files.find(f => f.name === "index.html")
    if (!mainFile) {
      return NextResponse.json({ error: "No index.html file found" }, { status: 404 })
    }

    // Return the HTML content with proper headers
    return new NextResponse(mainFile.content, {
      headers: {
        "Content-Type": "text/html",
      },
    })
  } catch (error) {
    console.error("Error previewing project:", error)
    return NextResponse.json({ error: "Failed to preview project" }, { status: 500 })
  }
} 