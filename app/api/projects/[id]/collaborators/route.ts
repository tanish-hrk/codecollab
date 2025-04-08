import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { findProjectById, findCollaboratorsByProjectId, hasProjectAccess, getDb } from "@/lib/db"
import { COLLECTIONS, Role } from "@/lib/models"

// Get all collaborators for a project
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id as string
    const projectId = params.id

    // Check if user has access to this project
    const hasAccess = await hasProjectAccess(projectId, userId)

    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized access to project" }, { status: 403 })
    }

    // Get project owner
    const project = await findProjectById(projectId)

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Get owner details
    const db = await getDb()
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

    // Format response
    const formattedCollaborators = [
      {
        id: owner._id.toString(),
        name: owner.name,
        email: owner.email,
        image: owner.image,
        role: Role.OWNER,
        isOwner: true,
      },
      ...collaborators.map((c) => {
        const user = collaboratorUsers.find((u) => u._id.toString() === c.userId.toString())
        return {
          id: c.userId.toString(),
          name: user?.name || "Unknown User",
          email: user?.email,
          image: user?.image,
          role: c.role,
          isOwner: false,
        }
      }),
    ]

    return NextResponse.json(formattedCollaborators)
  } catch (error) {
    console.error("Error fetching collaborators:", error)
    return NextResponse.json({ error: "Failed to fetch collaborators" }, { status: 500 })
  }
}

// Update a collaborator's role
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id as string
    const projectId = params.id
    const { collaboratorId, role } = await req.json()

    if (!collaboratorId || !role) {
      return NextResponse.json({ error: "Collaborator ID and role are required" }, { status: 400 })
    }

    // Check if user is the project owner
    const project = await findProjectById(projectId)

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    if (project.ownerId.toString() !== userId) {
      return NextResponse.json({ error: "Only the project owner can update collaborator roles" }, { status: 403 })
    }

    // Update collaborator role
    const db = await getDb()
    const result = await db.collection(COLLECTIONS.PROJECT_COLLABORATORS).findOneAndUpdate(
      {
        projectId: new ObjectId(projectId),
        userId: new ObjectId(collaboratorId),
      },
      { $set: { role, updatedAt: new Date() } },
      { returnDocument: "after" },
    )

    if (!result.value) {
      return NextResponse.json({ error: "Collaborator not found" }, { status: 404 })
    }

    // Get user details
    const user = await db.collection(COLLECTIONS.USERS).findOne({
      _id: new ObjectId(collaboratorId),
    })

    return NextResponse.json({
      id: collaboratorId,
      name: user?.name || "Unknown User",
      email: user?.email,
      image: user?.image,
      role: result.value.role,
      isOwner: false,
    })
  } catch (error) {
    console.error("Error updating collaborator:", error)
    return NextResponse.json({ error: "Failed to update collaborator" }, { status: 500 })
  }
}

// Remove a collaborator
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id as string
    const projectId = params.id
    const url = new URL(req.url)
    const collaboratorId = url.searchParams.get("collaboratorId")

    if (!collaboratorId) {
      return NextResponse.json({ error: "Collaborator ID is required" }, { status: 400 })
    }

    // Check if user is the project owner or the collaborator themselves
    const project = await findProjectById(projectId)

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const isOwner = project.ownerId.toString() === userId
    const isSelf = collaboratorId === userId

    if (!isOwner && !isSelf) {
      return NextResponse.json(
        { error: "Only the project owner or the collaborator themselves can remove a collaborator" },
        { status: 403 },
      )
    }

    // Remove collaborator
    const db = await getDb()
    const result = await db.collection(COLLECTIONS.PROJECT_COLLABORATORS).findOneAndDelete({
      projectId: new ObjectId(projectId),
      userId: new ObjectId(collaboratorId),
    })

    if (!result.value) {
      return NextResponse.json({ error: "Collaborator not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing collaborator:", error)
    return NextResponse.json({ error: "Failed to remove collaborator" }, { status: 500 })
  }
}

