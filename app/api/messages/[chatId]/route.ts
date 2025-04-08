import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { find, insertOne } from "@/lib/db"
import { COLLECTIONS } from "@/lib/models"

// Get messages for a specific chat
export async function GET(
  request: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const chatId = params.chatId

    // Get messages between the current user and the chat partner
    const messages = await find(COLLECTIONS.MESSAGES, {
      $or: [
        {
          senderId: new ObjectId(userId),
          receiverId: new ObjectId(chatId),
        },
        {
          senderId: new ObjectId(chatId),
          receiverId: new ObjectId(userId),
        },
      ],
    })

    // Sort messages by creation time
    messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

    return NextResponse.json(messages)
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

// Send a new message
export async function POST(
  request: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { content } = await request.json()

    if (!content) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 })
    }

    const userId = session.user.id
    const chatId = params.chatId

    const message = await insertOne(COLLECTIONS.MESSAGES, {
      content,
      senderId: new ObjectId(userId),
      receiverId: new ObjectId(chatId),
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
} 