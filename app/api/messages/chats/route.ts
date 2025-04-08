import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { findOne, find } from "@/lib/db"
import { COLLECTIONS } from "@/lib/models"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Get all messages where the user is either sender or receiver
    const messages = await find(COLLECTIONS.MESSAGES, {
      $or: [
        { senderId: new ObjectId(userId) },
        { receiverId: new ObjectId(userId) },
      ],
    })

    // Group messages by chat partner
    const chats = new Map<string, any>()

    for (const message of messages) {
      const partnerId = message.senderId.toString() === userId
        ? message.receiverId.toString()
        : message.senderId.toString()

      if (!chats.has(partnerId)) {
        const partner = await findOne(COLLECTIONS.USERS, {
          _id: new ObjectId(partnerId),
        })

        if (partner) {
          chats.set(partnerId, {
            id: partnerId,
            userId: partnerId,
            userName: partner.name,
            userImage: partner.image,
            lastMessage: message.content,
            lastMessageTime: message.createdAt,
            unreadCount: 0, // TODO: Implement unread count
          })
        }
      }
    }

    return NextResponse.json(Array.from(chats.values()))
  } catch (error) {
    console.error("Error fetching chats:", error)
    return NextResponse.json({ error: "Failed to fetch chats" }, { status: 500 })
  }
} 