import type { ObjectId } from "mongodb"

// Define types for our MongoDB documents
export interface User {
  _id?: ObjectId
  name: string
  email: string
  emailVerified?: Date
  image?: string
  password?: string
  createdAt: Date
  updatedAt: Date
}

export interface Account {
  _id?: ObjectId
  userId: ObjectId
  type: string
  provider: string
  providerAccountId: string
  refresh_token?: string
  access_token?: string
  expires_at?: number
  token_type?: string
  scope?: string
  id_token?: string
  session_state?: string
}

export interface Session {
  _id?: ObjectId
  sessionToken: string
  userId: ObjectId
  expires: Date
}

export interface VerificationToken {
  _id?: ObjectId
  identifier: string
  token: string
  expires: Date
}

export interface Project {
  _id?: ObjectId
  name: string
  description?: string
  language: string
  shareCode: string
  createdAt: Date
  updatedAt: Date
  ownerId: ObjectId
}

export enum Role {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
  VIEWER = "VIEWER",
}

export interface ProjectCollaborator {
  _id?: ObjectId
  projectId: ObjectId
  userId: ObjectId
  role: Role
  joinedAt: Date
}

export interface File {
  _id?: ObjectId
  name: string
  path: string
  content: string
  projectId: ObjectId
  createdAt: Date
  updatedAt: Date
}

export enum ActivityType {
  FILE_CREATED = "FILE_CREATED",
  FILE_UPDATED = "FILE_UPDATED",
  FILE_DELETED = "FILE_DELETED",
  PROJECT_CREATED = "PROJECT_CREATED",
  PROJECT_UPDATED = "PROJECT_UPDATED",
  PROJECT_DELETED = "PROJECT_DELETED",
  TEAM_MEMBER_ADDED = "TEAM_MEMBER_ADDED",
  TEAM_MEMBER_REMOVED = "TEAM_MEMBER_REMOVED",
  TEAM_INVITATION_SENT = "TEAM_INVITATION_SENT",
  TEAM_INVITATION_ACCEPTED = "TEAM_INVITATION_ACCEPTED",
  TEAM_INVITATION_REJECTED = "TEAM_INVITATION_REJECTED",
}

export interface Activity {
  _id?: ObjectId
  type: ActivityType
  projectId: ObjectId
  userId: ObjectId
  fileId?: ObjectId
  metadata?: any
  createdAt: Date
}

export interface Message {
  _id?: ObjectId
  content: string
  projectId: ObjectId
  userId: ObjectId
  createdAt: Date
}

// Collection names
export const COLLECTIONS = {
  USERS: "users",
  ACCOUNTS: "accounts",
  SESSIONS: "sessions",
  VERIFICATION_TOKENS: "verificationTokens",
  PROJECTS: "projects",
  PROJECT_COLLABORATORS: "projectCollaborators",
  FILES: "files",
  ACTIVITIES: "activities",
  MESSAGES: "messages",
  TEAM_MEMBERS: "team_members",
  TEAM_INVITATIONS: "team_invitations",
  INVITATIONS: "invitations",
} as const

