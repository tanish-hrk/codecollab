import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { hasProjectAccess, findActivitiesByProjectId, getDb } from "@/lib/db"
import { COLLECTIONS } from "@/lib/models"

// Get activities for a project
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

    // Get activities with pagination
    const url = new URL(req.url)
    const limit = Number.parseInt(url.searchParams.get("limit") || "20")
    const before = url.searchParams.get("before")

    const activities = await findActivitiesByProjectId(projectId, limit, before ? new Date(before) : undefined)

    // Get user details for activity users
    const db = await getDb()
    const userIds = [...new Set(activities.map((a) => a.userId.toString()))]
    const users =
      userIds.length > 0
        ? await db
            .collection(COLLECTIONS.USERS)
            .find({ _id: { $in: userIds.map((id) => new ObjectId(id)) } })
            .toArray()
        : []

    // Get file details for activities with fileId
    const fileIds = activities.filter((a) => a.fileId).map((a) => a.fileId.toString())

    const files =
      fileIds.length > 0
        ? await db
            .collection(COLLECTIONS.FILES)
            .find({ _id: { $in: fileIds.map((id) => new ObjectId(id)) } })
            .toArray()
        : []

    // Format activities
    const formattedActivities = activities.map((activity) => {
      const user = users.find((u) => u._id.toString() === activity.userId.toString())
      const file = activity.fileId ? files.find((f) => f._id.toString() === activity.fileId.toString()) : null

      return {
        id: activity._id.toString(),
        type: activity.type,
        user: {
          id: activity.userId.toString(),
          name: user?.name || "Unknown User",
          image: user?.image,
        },
        file: file
          ? {
              id: file._id.toString(),
              name: file.name,
              path: file.path,
            }
          : null,
        metadata: activity.metadata,
        timestamp: activity.createdAt,
      }
    })

    return NextResponse.json(formattedActivities)
  } catch (error) {
    console.error("Error fetching activities:", error)
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 })
  }
}

