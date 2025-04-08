import nodemailer from "nodemailer"

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
  debug: true, // Enable debug logging
  logger: true, // Enable logger
})

// Verify transporter configuration
transporter.verify(function (error, success) {
  if (error) {
    console.error("SMTP Connection Error:", error)
  } else {
    console.log("SMTP Server is ready to send messages")
  }
})

export async function sendTeamInvitationEmail({
  to,
  from,
  invitationLink,
}: {
  to: string
  from: string
  invitationLink: string
}) {
  try {
    const mailOptions = {
      from: `"CodeCollab" <${process.env.EMAIL_FROM}>`,
      to,
      subject: "Team Invitation - CodeCollab",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Team Invitation</h2>
          <p>Hello,</p>
          <p>You have been invited to join a team on CodeCollab by ${from}.</p>
          <p>Click the button below to accept the invitation:</p>
          <div style="margin: 30px 0;">
            <a href="${invitationLink}" 
               style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          <p>If you did not expect this invitation, you can safely ignore this email.</p>
          <p>Best regards,<br>The CodeCollab Team</p>
        </div>
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("Email sent successfully:", info.messageId)
    return true
  } catch (error) {
    console.error("Error sending email:", error)
    throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
} 