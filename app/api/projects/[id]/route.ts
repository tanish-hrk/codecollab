import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ObjectId } from "mongodb"
import {
  findProjectById,
  findFilesByProjectId,
  findCollaboratorsByProjectId,
  updateOne,
  deleteOne,
  getDb,
} from "@/lib/db"
import { COLLECTIONS } from "@/lib/models"

// Get a specific project
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id as string
    const projectId = params.id

    // Get the project
    const project = await findProjectById(projectId)

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Check if user is owner or collaborator
    const isOwner = project.ownerId.toString() === userId

    const db = await getDb()
    const collaborator = await db.collection(COLLECTIONS.PROJECT_COLLABORATORS).findOne({
      projectId: new ObjectId(projectId),
      userId: new ObjectId(userId),
    })

    const isCollaborator = !!collaborator

    if (!isOwner && !isCollaborator) {
      return NextResponse.json({ error: "Unauthorized access to project" }, { status: 403 })
    }

    // Get owner details
    const owner = await db.collection(COLLECTIONS.USERS).findOne({
      _id: project.ownerId,
    })

    // Get collaborators
    const collaborators = await findCollaboratorsByProjectId(projectId)

    // Get collaborator user details
    const collaboratorIds = collaborators.map((c) => c.userId)
    const collaboratorUsers =
      collaboratorIds.length > 0
        ? await db
            .collection(COLLECTIONS.USERS)
            .find({ _id: { $in: collaboratorIds } })
            .toArray()
        : []

    // Get files
    const files = await findFilesByProjectId(projectId)

    // Format project for response
    const formattedProject = {
      id: project._id.toString(),
      name: project.name,
      description: project.description,
      language: project.language,
      shareCode: project.shareCode,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      owner: {
        id: owner?._id.toString(),
        name: owner?.name,
        image: owner?.image,
      },
      isOwned: isOwner,
      collaborators: collaborators.map((c) => {
        const user = collaboratorUsers.find((u) => u._id.toString() === c.userId.toString())
        return {
          id: c.userId.toString(),
          name: user?.name || "Unknown User",
          image: user?.image,
          role: c.role,
          online: false, // This would be updated via Socket.io
        }
      }),
      files: files.map((f) => ({
        id: f._id.toString(),
        name: f.name,
        path: f.path,
        updatedAt: f.updatedAt,
      })),
    }

    return NextResponse.json(formattedProject)
  } catch (error) {
    console.error("Error fetching project:", error)
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 })
  }
}

// Update a project
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id as string
    const projectId = params.id
    const data = await req.json()

    // Check if user is the owner
    const project = await findProjectById(projectId)

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    if (project.ownerId.toString() !== userId) {
      return NextResponse.json({ error: "Only the owner can update project details" }, { status: 403 })
    }

    // Update the project
    const updatedProject = await updateOne(COLLECTIONS.PROJECTS, projectId, {
      name: data.name,
      description: data.description,
      language: data.language,
    })

    return NextResponse.json({
      id: updatedProject._id.toString(),
      name: updatedProject.name,
      description: updatedProject.description,
      language: updatedProject.language,
      updatedAt: updatedProject.updatedAt,
    })
  } catch (error) {
    console.error("Error updating project:", error)
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 })
  }
}

// Delete a project
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id as string
    const projectId = params.id

    // Check if user is the owner
    const project = await findProjectById(projectId)

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    if (project.ownerId.toString() !== userId) {
      return NextResponse.json({ error: "Only the owner can delete the project" }, { status: 403 })
    }

    // Delete the project
    await deleteOne(COLLECTIONS.PROJECTS, projectId)

    // Delete related records
    const db = await getDb()
    await db.collection(COLLECTIONS.FILES).deleteMany({ projectId: new ObjectId(projectId) })
    await db.collection(COLLECTIONS.PROJECT_COLLABORATORS).deleteMany({ projectId: new ObjectId(projectId) })
    await db.collection(COLLECTIONS.MESSAGES).deleteMany({ projectId: new ObjectId(projectId) })
    await db.collection(COLLECTIONS.ACTIVITIES).deleteMany({ projectId: new ObjectId(projectId) })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting project:", error)
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 })
  }
}

