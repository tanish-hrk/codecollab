import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { sendTeamInvitationEmail } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    const db = await getDb()

    // Check if the user is already a team member
    const existingMember = await db.collection("team_members").findOne({
      email,
      ownerId: session.user.id,
      status: "active",
    })

    if (existingMember) {
      return NextResponse.json(
        { error: "This user is already a team member" },
        { status: 400 }
      )
    }

    // Check for existing invitation
    const existingInvitation = await db.collection("team_invitations").findOne({
      email,
      ownerId: session.user.id,
      status: "pending",
    })

    const token = Math.random().toString(36).substring(2, 15)
    const invitationLink = `${process.env.NEXTAUTH_URL}/accept-invitation?token=${token}`

    try {
      // Send invitation email first
      await sendTeamInvitationEmail({
        to: email,
        from: session.user.name || session.user.email || "A team member",
        invitationLink,
      })

      if (existingInvitation) {
        // Update the existing invitation
        await db.collection("team_invitations").updateOne(
          { _id: existingInvitation._id },
          {
            $set: {
              token,
              createdAt: new Date(),
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          }
        )

        return NextResponse.json({
          message: "Invitation resent successfully",
          email,
        })
      } else {
        // Create a new invitation
        const invitation = {
          email,
          ownerId: session.user.id,
          status: "pending",
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          token,
        }

        await db.collection("team_invitations").insertOne(invitation)

        return NextResponse.json({
          message: "Invitation sent successfully",
          email,
        })
      }
    } catch (emailError) {
      console.error("Email sending error:", emailError)
      return NextResponse.json(
        { error: "Failed to send invitation email" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error in invitation process:", error)
    return NextResponse.json(
      { error: "Failed to process invitation" },
      { status: 500 }
    )
  }
} 