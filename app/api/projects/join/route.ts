import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { getDb, insertOne } from "@/lib/db"
import { COLLECTIONS, ActivityType, Role } from "@/lib/models"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id as string
    const { shareCode } = await req.json()

    if (!shareCode) {
      return NextResponse.json({ error: "Share code is required" }, { status: 400 })
    }

    // Find project by share code
    const db = await getDb()
    const project = await db.collection(COLLECTIONS.PROJECTS).findOne({ shareCode })

    if (!project) {
      return NextResponse.json({ error: "Invalid share code" }, { status: 404 })
    }

    // Check if user is already a collaborator or owner
    if (project.ownerId.toString() === userId) {
      return NextResponse.json({ error: "You are the owner of this project" }, { status: 400 })
    }

    const existingCollaborator = await db.collection(COLLECTIONS.PROJECT_COLLABORATORS).findOne({
      projectId: project._id,
      userId: new ObjectId(userId),
    })

    if (existingCollaborator) {
      return NextResponse.json({ error: "You are already a collaborator on this project" }, { status: 400 })
    }

    // Add user as a collaborator
    const collaborator = await insertOne(COLLECTIONS.PROJECT_COLLABORATORS, {
      projectId: project._id,
      userId: new ObjectId(userId),
      role: Role.MEMBER,
      joinedAt: new Date(),
    })

    // Record activity
    await insertOne(COLLECTIONS.ACTIVITIES, {
      type: ActivityType.USER_JOINED,
      projectId: project._id,
      userId: new ObjectId(userId),
      createdAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      projectId: project._id.toString(),
      role: collaborator.role,
    })
  } catch (error) {
    console.error("Error joining project:", error)
    return NextResponse.json({ error: "Failed to join project" }, { status: 500 })
  }
}

