"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { PlusIcon, GripVertical } from "lucide-react"

export const LANGUAGE_VERSIONS = {
  javascript: "18.15.0",
  typescript: "5.0.3",
  python: "3.10.0",
  java: "15.0.2",
  csharp: "6.12.0",
  php: "8.2.3",
}

export const CODE_SNIPPETS = {
  javascript: `function greet(name) {
  console.log("Hello, " + name + "!");
}

greet("Alex");`,
  typescript: `type Params = {
  name: string;
}

function greet(data: Params) {
  console.log("Hello, " + data.name + "!");
}

greet({ name: "Alex" });`,
  python: `def greet(name):
    print("Hello, " + name + "!")

greet("Alex")`,
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
  csharp: `using System;

class Program {
    static void Main(string[] args) {
        Console.WriteLine("Hello, World!");
    }
}`,
  php: `<?php
$name = "Alex";
echo "Hello, " . $name . "!";
?>`,
}

interface File {
  id: string
  name: string
  content: string
  language: string
}

interface CodeEditorProps {
  files: File[]
  onSave: (fileId: string, content: string, language: string) => Promise<void>
  onCreate: (name: string, language: string) => Promise<void>
  className?: string
}

export function CodeEditor({ files, onSave, onCreate, className }: CodeEditorProps) {
  const [activeFile, setActiveFile] = useState<File | null>(files?.[0] || null)
  const [selectedLanguage, setSelectedLanguage] = useState(activeFile?.language || "javascript")
  const [output, setOutput] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [isError, setIsError] = useState(false)
  const [newFileName, setNewFileName] = useState("")
  const [showNewFileInput, setShowNewFileInput] = useState(false)
  const [code, setCode] = useState(activeFile?.content || CODE_SNIPPETS[selectedLanguage])
  const [editorHeight, setEditorHeight] = useState("70%")
  const resizeRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!activeFile && files.length > 0) {
      setActiveFile(files[0])
    }
  }, [files, activeFile])

  useEffect(() => {
    if (activeFile) {
      setCode(activeFile.content || CODE_SNIPPETS[activeFile.language])
      setSelectedLanguage(activeFile.language)
    }
  }, [activeFile])

  useEffect(() => {
    const container = containerRef.current
    const resizer = resizeRef.current
    if (!container || !resizer) return

    let startY = 0
    let startHeight = 0

    function startResize(e: MouseEvent) {
      startY = e.clientY
      const editorDiv = container.querySelector('[data-editor-container]') as HTMLDivElement
      if (editorDiv) {
        startHeight = editorDiv.offsetHeight
      }
      
      document.addEventListener('mousemove', resize)
      document.addEventListener('mouseup', stopResize)
    }

    function resize(e: MouseEvent) {
      if (!container) return
      const editorDiv = container.querySelector('[data-editor-container]') as HTMLDivElement
      if (!editorDiv) return

      const containerHeight = container.offsetHeight
      const delta = e.clientY - startY
      const newHeight = Math.min(Math.max(startHeight + delta, 100), containerHeight - 100)
      const percentage = (newHeight / containerHeight) * 100
      setEditorHeight(`${percentage}%`)
    }

    function stopResize() {
      document.removeEventListener('mousemove', resize)
      document.removeEventListener('mouseup', stopResize)
    }

    resizer.addEventListener('mousedown', startResize)

    return () => {
      resizer.removeEventListener('mousedown', startResize)
      document.removeEventListener('mousemove', resize)
      document.removeEventListener('mouseup', stopResize)
    }
  }, [])

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language)
    if (activeFile) {
      const updatedFile = { ...activeFile, language }
      setActiveFile(updatedFile)
      setCode(updatedFile.content || CODE_SNIPPETS[language])
    }
  }

  const handleRunCode = async () => {
    if (!activeFile || !code) return

    setIsRunning(true)
    setIsError(false)
    setOutput([])

    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: selectedLanguage,
          sourceCode: code,
          version: LANGUAGE_VERSIONS[selectedLanguage],
        }),
      })

      const data = await response.json()
      
      if (!response.ok) throw new Error(data.error)
      
      if (data.run) {
        const output = []
        if (data.run.stdout) output.push(data.run.stdout)
        if (data.run.stderr) {
          setIsError(true)
          output.push(data.run.stderr)
        }
        setOutput(output.join("\n").split("\n"))
      } else {
        throw new Error("Invalid response from execution service")
      }
    } catch (error) {
      console.error("Error running code:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to run code",
        variant: "destructive",
      })
      setIsError(true)
      setOutput(["Error: " + (error.message || "Failed to run code")])
    } finally {
      setIsRunning(false)
    }
  }

  const handleSaveFile = async () => {
    if (!activeFile) return

    try {
      await onSave(activeFile.id, code, selectedLanguage)
      
      // Update local state
      const updatedFile = { ...activeFile, content: code, language: selectedLanguage }
      setActiveFile(updatedFile)
      setCode(updatedFile.content || CODE_SNIPPETS[updatedFile.language])
      
      toast({
        title: "Success",
        description: "File saved successfully",
      })
    } catch (error) {
      console.error("Error saving file:", error)
      toast({
        title: "Error",
        description: "Failed to save file",
        variant: "destructive",
      })
    }
  }

  const handleCreateFile = async () => {
    if (!newFileName) return

    try {
      await onCreate(newFileName, selectedLanguage)
      setNewFileName("")
      setShowNewFileInput(false)
      toast({
        title: "Success",
        description: "File created successfully",
      })
    } catch (error) {
      console.error("Error creating file:", error)
      toast({
        title: "Error",
        description: "Failed to create file",
        variant: "destructive",
      })
    }
  }

  const handleFileClick = (file: File) => {
    if (activeFile?.id === file.id) return
    setActiveFile(file)
  }

  return (
    <div className={`flex h-full flex-col overflow-hidden ${className || ""}`} ref={containerRef}>
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          {files.map((file) => (
            <Button
              key={file.id}
              variant={activeFile?.id === file.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveFile(file)}
            >
              {file.name}
            </Button>
          ))}
          {showNewFileInput ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                if (!newFileName) return
                try {
                  await onCreate(newFileName, selectedLanguage)
                  setNewFileName("")
                  setShowNewFileInput(false)
                } catch (error) {
                  console.error("Error creating file:", error)
                  toast({
                    title: "Error",
                    description: "Failed to create file",
                    variant: "destructive",
                  })
                }
              }}
              className="flex items-center gap-2"
            >
              <Input
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="File name..."
                className="h-8 w-32"
              />
              <Button size="sm" type="submit">
                Create
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setNewFileName("")
                  setShowNewFileInput(false)
                }}
              >
                Cancel
              </Button>
            </form>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setShowNewFileInput(true)}>
              <PlusIcon className="mr-1 h-4 w-4" />
              New File
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="typescript">TypeScript</SelectItem>
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="java">Java</SelectItem>
              <SelectItem value="csharp">C#</SelectItem>
              <SelectItem value="php">PHP</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={handleSaveFile}>
            Save
          </Button>
          <Button size="sm" onClick={handleRunCode} disabled={isRunning}>
            {isRunning ? "Running..." : "Run"}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div 
          data-editor-container 
          className="h-[70%] overflow-hidden border-b"
          style={{ height: editorHeight }}
        >
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="h-full w-full resize-none border-0 bg-background p-4 font-mono focus:outline-none"
            spellCheck={false}
          />
        </div>

        <div
          ref={resizeRef}
          className="flex h-2 cursor-ns-resize items-center justify-center border-b bg-muted hover:bg-muted-foreground/20"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="flex-1 overflow-auto p-4 font-mono">
          {output.map((line, i) => (
            <div
              key={i}
              className={`whitespace-pre-wrap ${isError ? "text-destructive" : ""}`}
            >
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 