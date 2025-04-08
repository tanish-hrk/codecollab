import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { getDb, hasProjectAccess, insertOne } from "@/lib/db"
import { COLLECTIONS } from "@/lib/models"
import { CODE_SNIPPETS } from "@/components/editor/CodeEditor"

// Get all files for a project
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDb()

    // Get all files for the project
    const files = await db.collection(COLLECTIONS.FILES)
      .find({ projectId: new ObjectId(params.id) })
      .toArray()

    return NextResponse.json(
      files.map((file) => ({
        id: file._id.toString(),
        name: file.name,
        content: file.content || "",
        language: file.language || "javascript",
        projectId: file.projectId.toString(),
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
      }))
    )
  } catch (error) {
    console.error("Error fetching files:", error)
    return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 })
  }
}

// Create a new file
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const hasAccess = await hasProjectAccess(params.id, session.user.id)
    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, language } = await req.json()
    
    const file = await insertOne(COLLECTIONS.FILES, {
      name,
      language: language || "javascript",
      content: CODE_SNIPPETS[language] || "",
      projectId: new ObjectId(params.id),
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({
      id: file.insertedId.toString(),
      name,
      language: language || "javascript",
      content: CODE_SNIPPETS[language] || "",
      projectId: params.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  } catch (error) {
    console.error("Error creating file:", error)
    return NextResponse.json(
      { error: "Failed to create file" },
      { status: 500 }
    )
  }
}

