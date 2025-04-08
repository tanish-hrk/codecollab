import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { findUserByEmail, insertOne } from "@/lib/db"
import { COLLECTIONS } from "@/lib/models"
import { MongoDBAdapter } from "@next-auth/mongodb-adapter"
import clientPromise from "@/lib/mongodb"

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user using MongoDB adapter
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || "codecollab")
    
    const user = await db.collection(COLLECTIONS.USERS).insertOne({
      name,
      email,
      password: hashedPassword,
      emailVerified: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Create account for credentials provider
    await db.collection(COLLECTIONS.ACCOUNTS).insertOne({
      userId: user.insertedId,
      type: "credentials",
      provider: "credentials",
      providerAccountId: email,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ 
      id: user.insertedId.toString(),
      name,
      email,
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}

