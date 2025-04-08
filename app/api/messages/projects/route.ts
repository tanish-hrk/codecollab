import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { find, findOne } from "@/lib/db"
import { COLLECTIONS } from "@/lib/models"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Get all projects where the user is either owner or collaborator
    const projects = await find(COLLECTIONS.PROJECTS, {
      $or: [
        { ownerId: new ObjectId(userId) },
        { collaborators: { $elemMatch: { userId: new ObjectId(userId) } } },
      ],
    })

    if (!projects || projects.length === 0) {
      return NextResponse.json([])
    }

    // Get the last message and members for each project
    const projectChats = await Promise.all(
      projects.map(async (project) => {
        try {
          // Get the last message
          const lastMessage = await findOne(COLLECTIONS.MESSAGES, {
            projectId: project._id,
          }, { sort: { createdAt: -1 } })

          // Get project members
          const members = await Promise.all([
            // Get owner
            findOne(COLLECTIONS.USERS, { _id: project.ownerId }),
            // Get collaborators
            ...project.collaborators.map((collab: any) =>
              findOne(COLLECTIONS.USERS, { _id: collab.userId })
            ),
          ])

          // Get project details
          const projectDetails = await findOne(COLLECTIONS.PROJECTS, {
            _id: project._id,
          })

          return {
            id: project._id.toString(),
            projectId: project._id.toString(),
            projectName: project.name,
            lastMessage: lastMessage?.content || "No messages yet",
            lastMessageTime: lastMessage?.createdAt || new Date(),
            unreadCount: 0, // TODO: Implement unread count
            members: members
              .filter(Boolean)
              .map((member: any) => ({
                id: member._id.toString(),
                name: member.name,
                image: member.image,
              })),
            projectDetails: {
              name: projectDetails.name,
              description: projectDetails.description,
              language: projectDetails.language,
            },
          }
        } catch (error) {
          console.error(`Error processing project ${project._id}:`, error)
          return null
        }
      })
    )

    // Filter out any failed project chats
    const validProjectChats = projectChats.filter(Boolean)

    return NextResponse.json(validProjectChats)
  } catch (error) {
    console.error("Error fetching project chats:", error)
    return NextResponse.json({ error: "Failed to fetch project chats" }, { status: 500 })
  }
} 