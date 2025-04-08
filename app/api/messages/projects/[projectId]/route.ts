import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { find, insertOne, findOne } from "@/lib/db"
import { COLLECTIONS } from "@/lib/models"

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const projectId = params.projectId

    // Verify user has access to the project
    const project = await findOne(COLLECTIONS.PROJECTS, {
      _id: new ObjectId(projectId),
      $or: [
        { ownerId: new ObjectId(userId) },
        { collaborators: { $elemMatch: { userId: new ObjectId(userId) } } },
      ],
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 })
    }

    // Get all messages for the project with sender details
    const messages = await find(COLLECTIONS.MESSAGES, {
      projectId: new ObjectId(projectId),
    }, { sort: { createdAt: 1 } })

    // Get sender details for each message
    const messagesWithSenders = await Promise.all(
      messages.map(async (message) => {
        const sender = await findOne(COLLECTIONS.USERS, {
          _id: message.senderId,
        })

        return {
          id: message._id.toString(),
          content: message.content,
          senderId: message.senderId.toString(),
          projectId: message.projectId.toString(),
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
          sender: {
            id: sender._id.toString(),
            name: sender.name,
            image: sender.image,
          },
        }
      })
    )

    return NextResponse.json(messagesWithSenders)
  } catch (error) {
    console.error("Error fetching project messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const projectId = params.projectId
    const { content } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 })
    }

    // Verify user has access to the project
    const project = await findOne(COLLECTIONS.PROJECTS, {
      _id: new ObjectId(projectId),
      $or: [
        { ownerId: new ObjectId(userId) },
        { collaborators: { $elemMatch: { userId: new ObjectId(userId) } } },
      ],
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 })
    }

    // Get sender details
    const sender = await findOne(COLLECTIONS.USERS, { _id: new ObjectId(userId) })

    // Create new message
    const message = {
      content: content.trim(),
      senderId: new ObjectId(userId),
      projectId: new ObjectId(projectId),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await insertOne(COLLECTIONS.MESSAGES, message)

    return NextResponse.json({
      id: result.insertedId.toString(),
      content: message.content,
      senderId: userId,
      projectId: projectId,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      sender: {
        id: sender._id.toString(),
        name: sender.name,
        image: sender.image,
      },
    })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
} 