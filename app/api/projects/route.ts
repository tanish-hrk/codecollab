import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { findProjectsByOwnerId, findProjectsByCollaborator, insertOne, getDb, findById } from "@/lib/db"
import { COLLECTIONS } from "@/lib/models"
import { generateShareCode } from "@/lib/utils"
import { nanoid } from "nanoid"

// Get all projects for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const projects = await findProjectsByOwnerId(session.user.id)
    return NextResponse.json(projects)
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
  }
}

// Create a new project
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description, language } = await req.json()

    if (!name || !language) {
      return NextResponse.json({ error: "Name and language are required" }, { status: 400 })
    }

    // Generate a unique share code
    const shareCode = nanoid(8)

    const result = await insertOne(COLLECTIONS.PROJECTS, {
      name,
      description,
      language,
      shareCode,
      ownerId: new ObjectId(session.user.id),
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Create default files based on language
    const defaultFiles = getDefaultFiles(language, result.insertedId.toString())
    await Promise.all(defaultFiles.map(file => insertOne(COLLECTIONS.FILES, file)))

    // Fetch the created project to return complete data
    const project = await findById(COLLECTIONS.PROJECTS, result.insertedId.toString())
    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
  }
}

function getDefaultFiles(language: string, projectId: string) {
  const files = []
  
  switch (language.toLowerCase()) {
    case "javascript":
    case "typescript":
      files.push({
        name: "index.js",
        path: "/",
        content: `// Welcome to CodeCollab!
// Start coding here...

console.log("Hello, World!");`,
        projectId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      files.push({
        name: "package.json",
        path: "/",
        content: `{
  "name": "codecollab-project",
  "version": "1.0.0",
  "description": "A collaborative project on CodeCollab",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {},
  "devDependencies": {}
}`,
        projectId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      break
    case "python":
      files.push({
        name: "main.py",
        path: "/",
        content: `# Welcome to CodeCollab!
# Start coding here...

print("Hello, World!")`,
        projectId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      files.push({
        name: "requirements.txt",
        path: "/",
        content: "# Add your Python dependencies here",
        projectId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      break
    case "html":
      files.push({
        name: "index.html",
        path: "/",
        content: `<!DOCTYPE html>
<html>
<head>
  <title>CodeCollab Project</title>
</head>
<body>
  <h1>Welcome to CodeCollab!</h1>
  <p>Start coding here...</p>
</body>
</html>`,
        projectId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      break
    default:
      files.push({
        name: "README.md",
        path: "/",
        content: `# CodeCollab Project

Welcome to your new project! Start coding here...`,
        projectId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
  }

  return files
}

