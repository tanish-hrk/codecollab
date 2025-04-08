import { type NextRequest, NextResponse } from "next/server"
import { initSocketServer } from "@/server/socket"

export async function GET(req: NextRequest, res: NextResponse) {
  try {
    // Initialize Socket.io server
    initSocketServer(req as any, res as any)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Socket initialization error:", error)
    return NextResponse.json({ error: "Failed to initialize socket server" }, { status: 500 })
  }
}

