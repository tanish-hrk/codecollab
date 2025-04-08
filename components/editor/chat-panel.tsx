"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Mic, MicOff, Phone, Send } from "lucide-react"

interface ChatPanelProps {
  projectId: string
}

export default function ChatPanel({ projectId }: ChatPanelProps) {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([
    {
      id: "1",
      sender: { id: "1", name: "John Doe" },
      content: "Hey team, I just pushed some changes to the API routes.",
      timestamp: "10:30 AM",
    },
    {
      id: "2",
      sender: { id: "2", name: "Jane Smith" },
      content: "Great! I'll review them now.",
      timestamp: "10:32 AM",
    },
    {
      id: "3",
      sender: { id: "3", name: "Bob Johnson" },
      content: "I'm working on the user authentication flow. Should be done by EOD.",
      timestamp: "10:45 AM",
    },
  ])
  const [isInCall, setIsInCall] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  const handleSendMessage = () => {
    if (!message.trim()) return

    const newMessage = {
      id: Date.now().toString(),
      sender: { id: "1", name: "John Doe" },
      content: message,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages([...messages, newMessage])
    setMessage("")
  }

  return (
    <div className="flex h-full flex-col">
      <Tabs defaultValue="chat" className="flex-1">
        <div className="border-b">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
            <TabsTrigger
              value="chat"
              className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary"
            >
              Chat
            </TabsTrigger>
            <TabsTrigger
              value="voice"
              className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary"
            >
              Voice
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="chat" className="flex flex-1 flex-col p-0 data-[state=active]:flex">
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className="flex gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`/placeholder.svg?height=32&width=32`} alt={msg.sender.name} />
                    <AvatarFallback>{msg.sender.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-2">
                      <span className="font-medium">{msg.sender.name}</span>
                      <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                    </div>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSendMessage()
                  }
                }}
              />
              <Button size="icon" onClick={handleSendMessage}>
                <Send className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="voice" className="flex-1 p-0 data-[state=active]:flex">
          <div className="flex flex-1 flex-col items-center justify-center p-4">
            {isInCall ? (
              <div className="flex flex-col items-center space-y-6">
                <div className="flex -space-x-2">
                  <Avatar className="h-16 w-16 border-4 border-background">
                    <AvatarImage src="/placeholder.svg?height=64&width=64" alt="John Doe" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <Avatar className="h-16 w-16 border-4 border-background">
                    <AvatarImage src="/placeholder.svg?height=64&width=64" alt="Jane Smith" />
                    <AvatarFallback>JS</AvatarFallback>
                  </Avatar>
                  <Avatar className="h-16 w-16 border-4 border-background">
                    <AvatarImage src="/placeholder.svg?height=64&width=64" alt="Bob Johnson" />
                    <AvatarFallback>BJ</AvatarFallback>
                  </Avatar>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-medium">Team Call</h3>
                  <p className="text-sm text-muted-foreground">00:12:34</p>
                </div>
                <div className="flex gap-4">
                  <Button
                    variant={isMuted ? "destructive" : "outline"}
                    size="icon"
                    className="h-12 w-12 rounded-full"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-12 w-12 rounded-full"
                    onClick={() => setIsInCall(false)}
                  >
                    <Phone className="h-6 w-6" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <div className="rounded-full bg-muted p-8">
                  <Phone className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">Start a Voice Call</h3>
                <p className="text-center text-sm text-muted-foreground">
                  Collaborate with your team members in real-time with voice chat.
                </p>
                <Button onClick={() => setIsInCall(true)}>Start Call</Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

