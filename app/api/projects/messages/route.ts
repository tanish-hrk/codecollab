import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { COLLECTIONS } from "@/lib/models"
import { ObjectId } from "mongodb"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id as string
    const db = await getDb()

    // Get all projects the user has access to
    const projects = await db
      .collection(COLLECTIONS.PROJECTS)
      .find({
        $or: [
          { ownerId: new ObjectId(userId) },
          { collaborators: new ObjectId(userId) },
        ],
      })
      .toArray()

    // Get the latest message for each project
    const projectIds = projects.map((p) => p._id)
    const latestMessages = await Promise.all(
      projectIds.map(async (projectId) => {
        const message = await db
          .collection(COLLECTIONS.MESSAGES)
          .findOne(
            { projectId },
            {
              sort: { createdAt: -1 },
              projection: {
                content: 1,
                userId: 1,
                userName: 1,
                userImage: 1,
                createdAt: 1,
              },
            }
          )
        return { projectId, message }
      })
    )

    // Format the response
    const formattedProjects = projects.map((project) => {
      const latestMessage = latestMessages.find(
        (m) => m.projectId.toString() === project._id.toString()
      )?.message

      return {
        id: project._id.toString(),
        name: project.name,
        ...(latestMessage && {
          lastMessage: {
            content: latestMessage.content,
            sender: {
              name: latestMessage.userName,
              image: latestMessage.userImage,
            },
            timestamp: latestMessage.createdAt,
          },
        }),
      }
    })

    // Sort projects by latest message timestamp
    formattedProjects.sort((a, b) => {
      const aTime = a.lastMessage?.timestamp || 0
      const bTime = b.lastMessage?.timestamp || 0
      return new Date(bTime).getTime() - new Date(aTime).getTime()
    })

    return NextResponse.json(formattedProjects)
  } catch (error) {
    console.error("Error fetching projects with messages:", error)
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    )
  }
} 