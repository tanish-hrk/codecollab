import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { hasProjectAccess, findMessagesByProjectId, insertOne, getDb } from "@/lib/db"
import { COLLECTIONS } from "@/lib/models"

// Get messages for a project
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

    // Get messages with pagination
    const url = new URL(req.url)
    const limit = Number.parseInt(url.searchParams.get("limit") || "50")
    const before = url.searchParams.get("before")

    const messages = await findMessagesByProjectId(projectId, limit, before ? new Date(before) : undefined)

    // Get user details for message senders
    const db = await getDb()
    const userIds = [...new Set(messages.map((m) => m.userId.toString()))]
    const users =
      userIds.length > 0
        ? await db
            .collection(COLLECTIONS.USERS)
            .find({ _id: { $in: userIds.map((id) => new ObjectId(id)) } })
            .toArray()
        : []

    // Format and reverse to chronological order
    const formattedMessages = messages
      .map((message) => {
        const user = users.find((u) => u._id.toString() === message.userId.toString())
        return {
          id: message._id.toString(),
          content: message.content,
          sender: {
            id: message.userId.toString(),
            name: user?.name || "Unknown User",
            image: user?.image,
          },
          timestamp: message.createdAt,
        }
      })
      .reverse()

    return NextResponse.json(formattedMessages)
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

// Send a message
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id as string
    const projectId = params.id
    const { content } = await req.json()

    if (!content) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 })
    }

    // Check if user has access to this project
    const hasAccess = await hasProjectAccess(projectId, userId)

    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized access to project" }, { status: 403 })
    }

    // Create message
    const message = await insertOne(COLLECTIONS.MESSAGES, {
      content,
      projectId: new ObjectId(projectId),
      userId: new ObjectId(userId),
      userName: session.user.name,
      userImage: session.user.image,
      createdAt: new Date(),
    })

    return NextResponse.json({
      id: message._id.toString(),
      content: message.content,
      sender: {
        id: userId,
        name: session.user.name,
        image: session.user.image,
      },
      timestamp: message.createdAt,
    })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}

