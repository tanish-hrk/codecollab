import { ObjectId } from "mongodb"
import { COLLECTIONS } from "./models"
import clientPromise from "./mongodb"

export async function getDb() {
  const client = await clientPromise
  return client.db(process.env.MONGODB_DB || "codecollab")
}

export async function findOne(collection: string, query: any) {
  const db = await getDb()
  return await db.collection(collection).findOne(query)
}

export async function insertOne(collection: string, document: any) {
  const db = await getDb()
  return await db.collection(collection).insertOne(document)
}

export async function findFilesByProjectId(projectId: string) {
  const db = await getDb()
  return await db
    .collection(COLLECTIONS.FILES)
    .find({ projectId: new ObjectId(projectId) })
    .toArray()
}

export async function hasProjectAccess(projectId: string, userId: string) {
  const db = await getDb()
  const project = await db.collection(COLLECTIONS.PROJECTS).findOne({
    _id: new ObjectId(projectId),
    $or: [
      { ownerId: new ObjectId(userId) },
      { collaborators: { $elemMatch: { userId: new ObjectId(userId) } } },
    ],
  })
  return !!project
}

// Generic function to find a document by ID
export async function findById(collection: string, id: string) {
  const db = await getDb()
  return db.collection(collection).findOne({ _id: new ObjectId(id) })
}

// Generic function to find documents by a query
export async function find(collection: string, query: any, options: any = {}) {
  const db = await getDb()
  return db.collection(collection).find(query, options).toArray()
}

// Generic function to update a document
export async function updateOne(collection: string, id: string, update: any) {
  const db = await getDb()
  const result = await db
    .collection(collection)
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...update, updatedAt: new Date() } },
      { returnDocument: "after" },
    )
  return result.value
}

// Generic function to delete a document
export async function deleteOne(collection: string, id: string) {
  const db = await getDb()
  const result = await db.collection(collection).findOneAndDelete({ _id: new ObjectId(id) })
  return result.value
}

// User-specific functions
export async function findUserByEmail(email: string) {
  const db = await getDb()
  return db.collection(COLLECTIONS.USERS).findOne({ email })
}

export async function findUserById(id: string) {
  return findById(COLLECTIONS.USERS, id)
}

// Project-specific functions
export async function findProjectById(id: string) {
  return findById(COLLECTIONS.PROJECTS, id)
}

export async function findProjectsByOwnerId(ownerId: string) {
  const db = await getDb()
  // Check if ownerId is already an ObjectId instance
  const ownerObjectId = typeof ownerId === 'string' ? new ObjectId(ownerId) : ownerId
  return db
    .collection(COLLECTIONS.PROJECTS)
    .find({
      ownerId: ownerObjectId,
    })
    .toArray()
}

export async function findProjectsByCollaborator(userId: string) {
  const db = await getDb()
  const collaborations = await db
    .collection(COLLECTIONS.PROJECT_COLLABORATORS)
    .find({
      userId: new ObjectId(userId),
    })
    .toArray()

  const projectIds = collaborations.map((c) => c.projectId)
  if (projectIds.length === 0) return []

  return db
    .collection(COLLECTIONS.PROJECTS)
    .find({
      _id: { $in: projectIds },
    })
    .toArray()
}

// File-specific functions
export async function findFileById(id: string) {
  return findById(COLLECTIONS.FILES, id)
}

// Collaborator-specific functions
export async function findCollaboratorsByProjectId(projectId: string) {
  const db = await getDb()
  return db
    .collection(COLLECTIONS.PROJECT_COLLABORATORS)
    .find({
      projectId: new ObjectId(projectId),
    })
    .toArray()
}

export async function findCollaborator(projectId: string, userId: string) {
  const db = await getDb()
  return db.collection(COLLECTIONS.PROJECT_COLLABORATORS).findOne({
    projectId: new ObjectId(projectId),
    userId: new ObjectId(userId),
  })
}

// Message-specific functions
export async function findMessagesByProjectId(projectId: string, limit = 50, before?: Date) {
  const db = await getDb()
  const query: any = { projectId: new ObjectId(projectId) }

  if (before) {
    query.createdAt = { $lt: before }
  }

  return db.collection(COLLECTIONS.MESSAGES).find(query).sort({ createdAt: -1 }).limit(limit).toArray()
}

// Activity-specific functions
export async function findActivitiesByProjectId(projectId: string, limit = 20, before?: Date) {
  const db = await getDb()
  const query: any = { projectId: new ObjectId(projectId) }

  if (before) {
    query.createdAt = { $lt: before }
  }

  return db.collection(COLLECTIONS.ACTIVITIES).find(query).sort({ createdAt: -1 }).limit(limit).toArray()
}

export async function findTeamMembersByOwnerId(ownerId: string) {
  try {
    const db = await getDb()
    const teamMembers = await db
      .collection("team_members")
      .find({ ownerId })
      .toArray()

    return teamMembers.map((member) => ({
      id: member._id.toString(),
      name: member.name,
      email: member.email,
      image: member.image,
      role: member.role,
      status: member.status,
      joinedAt: member.joinedAt,
    }))
  } catch (error) {
    console.error("Error finding team members:", error)
    throw error
  }
}

