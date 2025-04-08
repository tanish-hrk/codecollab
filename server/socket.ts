import type { Server as NetServer } from "http"
import { Server as SocketIOServer } from "socket.io"
import type { NextApiRequest } from "next"
import { getSession } from "next-auth/react"
import { ObjectId } from "mongodb"
import { getDb, insertOne, hasProjectAccess, findById } from "@/lib/db"
import { COLLECTIONS, ActivityType } from "@/lib/models"

export type NextApiResponseWithSocket = {
  socket: {
    server: NetServer & {
      io?: SocketIOServer
    }
  }
}

export const initSocketServer = (req: NextApiRequest, res: NextApiResponseWithSocket) => {
  if (!res.socket.server.io) {
    console.log("Initializing Socket.io server...")
    const io = new SocketIOServer(res.socket.server)

    io.on("connection", async (socket) => {
      console.log("Client connected:", socket.id)

      // Authenticate user
      const session = await getSession({ req })
      if (!session || !session.user) {
        socket.disconnect()
        return
      }

      const userId = session.user.id as string

      // Join project room
      socket.on("join:project", async ({ projectId }) => {
        try {
          // Check if user has access to this project
          const hasAccess = await hasProjectAccess(projectId, userId)

          if (!hasAccess) {
            socket.emit("error", { message: "Unauthorized access to project" })
            return
          }

          // Join the project room
          socket.join(`project:${projectId}`)

          // Record user activity
          await insertOne(COLLECTIONS.ACTIVITIES, {
            type: ActivityType.USER_JOINED,
            projectId: new ObjectId(projectId),
            userId: new ObjectId(userId),
            createdAt: new Date(),
          })

          // Notify others that user joined
          socket.to(`project:${projectId}`).emit("user:joined", {
            userId,
            timestamp: new Date(),
          })

          // Send active users in this project
          const activeUsers = await getActiveProjectUsers(projectId)
          io.to(`project:${projectId}`).emit("users:active", activeUsers)

          console.log(`User ${userId} joined project ${projectId}`)
        } catch (error) {
          console.error("Error joining project:", error)
          socket.emit("error", { message: "Failed to join project" })
        }
      })

      // Handle file editing
      socket.on("file:open", async ({ projectId, fileId }) => {
        try {
          socket.join(`file:${fileId}`)

          // Notify others that user is editing this file
          socket.to(`project:${projectId}`).emit("file:user-editing", {
            fileId,
            userId,
            timestamp: new Date(),
          })

          // Get file content
          const file = await findById(COLLECTIONS.FILES, fileId)

          if (file) {
            socket.emit("file:content", {
              fileId,
              content: file.content,
            })
          }
        } catch (error) {
          console.error("Error opening file:", error)
          socket.emit("error", { message: "Failed to open file" })
        }
      })

      socket.on("file:update", async ({ projectId, fileId, content, cursorPosition }) => {
        try {
          const db = await getDb()

          // Update file in database
          await db.collection(COLLECTIONS.FILES).updateOne(
            { _id: new ObjectId(fileId) },
            {
              $set: {
                content,
                updatedAt: new Date(),
              },
            },
          )

          // Record activity
          await insertOne(COLLECTIONS.ACTIVITIES, {
            type: ActivityType.FILE_UPDATED,
            projectId: new ObjectId(projectId),
            userId: new ObjectId(userId),
            fileId: new ObjectId(fileId),
            createdAt: new Date(),
          })

          // Broadcast to others editing this file
          socket.to(`file:${fileId}`).emit("file:updated", {
            fileId,
            content,
            userId,
            cursorPosition,
            timestamp: new Date(),
          })
        } catch (error) {
          console.error("Error updating file:", error)
          socket.emit("error", { message: "Failed to update file" })
        }
      })

      // Handle chat messages
      socket.on("chat:message", async ({ projectId, content }) => {
        try {
          // Save message to database
          const message = await insertOne(COLLECTIONS.MESSAGES, {
            content,
            projectId: new ObjectId(projectId),
            userId: new ObjectId(userId),
          })

          // Get user details
          const db = await getDb()
          const user = await db.collection(COLLECTIONS.USERS).findOne({
            _id: new ObjectId(userId),
          })

          // Broadcast message to project room
          io.to(`project:${projectId}`).emit("chat:message", {
            id: message._id.toString(),
            content: message.content,
            sender: {
              id: userId,
              name: user?.name || "Unknown User",
              image: user?.image,
            },
            timestamp: message.createdAt,
          })
        } catch (error) {
          console.error("Error sending message:", error)
          socket.emit("error", { message: "Failed to send message" })
        }
      })

      // Handle voice calls
      socket.on("call:join", async ({ projectId }) => {
        try {
          socket.join(`call:${projectId}`)

          // Get user info
          const db = await getDb()
          const user = await db.collection(COLLECTIONS.USERS).findOne({
            _id: new ObjectId(userId),
          })

          // Record activity
          await insertOne(COLLECTIONS.ACTIVITIES, {
            type: ActivityType.VOICE_CALL_STARTED,
            projectId: new ObjectId(projectId),
            userId: new ObjectId(userId),
            createdAt: new Date(),
          })

          // Get all participants in the call
          const socketsInRoom = await io.in(`call:${projectId}`).fetchSockets()
          const participants = await Promise.all(
            socketsInRoom.map(async (s) => {
              const session = await getSession({ req: { headers: { cookie: s.request.headers.cookie } } })
              return {
                id: session?.user?.id,
                name: session?.user?.name,
                image: session?.user?.image,
              }
            }),
          )

          // Notify everyone in the call
          io.to(`call:${projectId}`).emit("call:user-joined", {
            user: {
              id: userId,
              name: user?.name,
              image: user?.image,
            },
            participants,
            timestamp: new Date(),
          })
        } catch (error) {
          console.error("Error joining call:", error)
          socket.emit("error", { message: "Failed to join call" })
        }
      })

      socket.on("call:leave", async ({ projectId }) => {
        try {
          socket.leave(`call:${projectId}`)

          // Record activity
          await insertOne(COLLECTIONS.ACTIVITIES, {
            type: ActivityType.VOICE_CALL_ENDED,
            projectId: new ObjectId(projectId),
            userId: new ObjectId(userId),
            createdAt: new Date(),
          })

          // Get user info
          const db = await getDb()
          const user = await db.collection(COLLECTIONS.USERS).findOne({
            _id: new ObjectId(userId),
          })

          // Get remaining participants
          const socketsInRoom = await io.in(`call:${projectId}`).fetchSockets()
          const participants = await Promise.all(
            socketsInRoom.map(async (s) => {
              const session = await getSession({ req: { headers: { cookie: s.request.headers.cookie } } })
              return {
                id: session?.user?.id,
                name: session?.user?.name,
                image: session?.user?.image,
              }
            }),
          )

          // Notify everyone in the call
          io.to(`call:${projectId}`).emit("call:user-left", {
            user: {
              id: userId,
              name: user?.name,
              image: user?.image,
            },
            participants,
            timestamp: new Date(),
          })
        } catch (error) {
          console.error("Error leaving call:", error)
          socket.emit("error", { message: "Failed to leave call" })
        }
      })

      // Handle disconnection
      socket.on("disconnect", async () => {
        try {
          console.log("Client disconnected:", socket.id)

          // Find all projects this user was active in
          const rooms = Array.from(socket.rooms)
          const projectRooms = rooms.filter((room) => room.startsWith("project:"))

          for (const room of projectRooms) {
            const projectId = room.replace("project:", "")

            // Record user left activity
            await insertOne(COLLECTIONS.ACTIVITIES, {
              type: ActivityType.USER_LEFT,
              projectId: new ObjectId(projectId),
              userId: new ObjectId(userId),
              createdAt: new Date(),
            })

            // Notify others that user left
            socket.to(room).emit("user:left", {
              userId,
              timestamp: new Date(),
            })

            // Update active users
            const activeUsers = await getActiveProjectUsers(projectId)
            io.to(room).emit("users:active", activeUsers)
          }
        } catch (error) {
          console.error("Error handling disconnect:", error)
        }
      })
    })

    res.socket.server.io = io
  }

  return res.socket.server.io
}

// Helper function to get active users in a project
async function getActiveProjectUsers(projectId: string) {
  try {
    const db = await getDb()

    // Get all collaborators
    const collaborators = await db
      .collection(COLLECTIONS.PROJECT_COLLABORATORS)
      .find({
        projectId: new ObjectId(projectId),
      })
      .toArray()

    // Get project owner
    const project = await db.collection(COLLECTIONS.PROJECTS).findOne({
      _id: new ObjectId(projectId),
    })

    // Get user details
    const userIds = [...collaborators.map((c) => c.userId), project?.ownerId].filter(Boolean)

    const users =
      userIds.length > 0
        ? await db
            .collection(COLLECTIONS.USERS)
            .find({ _id: { $in: userIds } })
            .toArray()
        : []

    // Format response
    return [
      // Owner
      ...(project
        ? [
            {
              ...(users.find((u) => u._id.toString() === project.ownerId.toString()) || {}),
              id: project.ownerId.toString(),
              role: "OWNER",
              online: true, // In a real implementation, check if they're actually online
            },
          ]
        : []),
      // Collaborators
      ...collaborators.map((c) => {
        const user = users.find((u) => u._id.toString() === c.userId.toString())
        return {
          ...user,
          id: c.userId.toString(),
          role: c.role,
          online: true, // In a real implementation, check if they're actually online
        }
      }),
    ]
  } catch (error) {
    console.error("Error getting active users:", error)
    return []
  }
}
\
Let's update the package.json to include MongoDB dependencies:

