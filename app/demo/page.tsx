"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import CodeEditor from "@/components/editor/code-editor"

export default function DemoPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  // Demo project data
  const demoProject = {
    id: "demo",
    name: "Demo Project",
    description: "This is a demo project to showcase CodeCollab features",
    language: "JavaScript",
    files: [
      {
        id: "1",
        name: "index.js",
        path: "/",
        content: `// Welcome to CodeCollab Demo!
// This is a simple Express.js server

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Sample data
const users = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
];

// Routes
app.get('/', (req, res) => {
  res.send('Hello from CodeCollab Demo API!');
});

app.get('/api/users', (req, res) => {
  res.json(users);
});

app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  
  const newUser = {
    id: users.length + 1,
    name,
    email
  };
  
  users.push(newUser);
  res.status(201).json(newUser);
});

// Start server
app.listen(port, () => {
  console.log(\`Server running on port \${port}\`);
});`,
      },
      {
        id: "2",
        name: "package.json",
        path: "/",
        content: `{
  "name": "codecollab-demo",
  "version": "1.0.0",
  "description": "Demo project for CodeCollab",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}`,
      },
      {
        id: "3",
        name: "README.md",
        path: "/",
        content: `# CodeCollab Demo Project

This is a simple Express.js API to demonstrate the features of CodeCollab.

## Features

- Real-time collaborative editing
- File management
- Chat functionality
- Voice calls

## Getting Started

1. Clone this repository
2. Run \`npm install\`
3. Run \`npm start\`
4. Open http://localhost:3000

## API Endpoints

- GET / - Welcome message
- GET /api/users - Get all users
- GET /api/users/:id - Get user by ID
- POST /api/users - Create a new user`,
      },
    ],
    activeFile: {
      id: "1",
      name: "index.js",
      path: "/",
      content: `// Welcome to CodeCollab Demo!
// This is a simple Express.js server

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Sample data
const users = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
];

// Routes
app.get('/', (req, res) => {
  res.send('Hello from CodeCollab Demo API!');
});

app.get('/api/users', (req, res) => {
  res.json(users);
});

app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  
  const newUser = {
    id: users.length + 1,
    name,
    email
  };
  
  users.push(newUser);
  res.status(201).json(newUser);
});

// Start server
app.listen(port, () => {
  console.log(\`Server running on port \${port}\`);
});`,
    },
    collaborators: [
      { id: "demo-user-1", name: "Demo User", email: "demo@example.com", online: true, role: "OWNER" },
      { id: "demo-user-2", name: "Guest User", email: "guest@example.com", online: true, role: "MEMBER" },
    ],
  }

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Demo Mode",
        description: "You're now in demo mode. Changes won't be saved.",
      })
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  const handleExitDemo = () => {
    router.push("/")
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Card className="w-[350px]">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-lg font-medium">Loading Demo Environment...</p>
            <p className="text-sm text-muted-foreground">Setting up your collaborative workspace</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-4">
          <div className="relative h-8 w-8">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8 text-primary"
            >
              <path d="m18 16 4-4-4-4" />
              <path d="m6 8-4 4 4 4" />
              <path d="m14.5 4-5 16" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold">{demoProject.name}</h1>
            <p className="text-sm text-muted-foreground">Demo Mode - Changes won't be saved</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExitDemo}>
            Exit Demo
          </Button>
          <Button size="sm">Run</Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r bg-muted/40">
          <div className="p-4">
            <h2 className="mb-2 text-lg font-semibold">Files</h2>
            <div className="space-y-1">
              {demoProject.files.map((file) => (
                <div
                  key={file.id}
                  className={`flex cursor-pointer items-center rounded-md px-2 py-1 text-sm ${
                    file.id === demoProject.activeFile.id ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2 h-4 w-4"
                  >
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  {file.name}
                </div>
              ))}
            </div>
          </div>
          <div className="border-t p-4">
            <h2 className="mb-2 text-lg font-semibold">Collaborators</h2>
            <div className="space-y-4">
              <div>
                <h3 className="mb-1 text-sm font-medium text-muted-foreground">Online (2)</h3>
                <div className="space-y-1">
                  {demoProject.collaborators.map((collaborator) => (
                    <div
                      key={collaborator.id}
                      className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-accent/50"
                    >
                      <div className="relative h-6 w-6 rounded-full bg-primary/10 text-center text-xs leading-6">
                        {collaborator.name.charAt(0)}
                        <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-green-500 ring-1 ring-white" />
                      </div>
                      <span>{collaborator.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col">
          <CodeEditor file={demoProject.activeFile} />
        </div>

        <div className="w-80 border-l">
          <div className="flex h-full flex-col">
            <div className="border-b">
              <div className="flex items-center justify-between px-4 py-2">
                <h2 className="text-lg font-semibold">Chat</h2>
                <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">Demo</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-center text-sm leading-8">D</div>
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-2">
                      <span className="font-medium">Demo User</span>
                      <span className="text-xs text-muted-foreground">10:30 AM</span>
                    </div>
                    <p className="text-sm">Welcome to the CodeCollab demo! Feel free to explore the features.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-center text-sm leading-8">G</div>
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-2">
                      <span className="font-medium">Guest User</span>
                      <span className="text-xs text-muted-foreground">10:32 AM</span>
                    </div>
                    <p className="text-sm">Thanks! I'm excited to try out the collaborative editing.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <Button size="icon" className="h-10 w-10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="m22 2-7 20-4-9-9-4Z" />
                    <path d="M22 2 11 13" />
                  </svg>
                  <span className="sr-only">Send</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

