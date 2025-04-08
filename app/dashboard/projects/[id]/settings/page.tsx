"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ProjectSettings {
  name: string
  description: string
  language: string
  visibility: "private" | "public"
}

export default function SettingsPage() {
  const params = useParams()
  const [settings, setSettings] = useState<ProjectSettings>({
    name: "",
    description: "",
    language: "",
    visibility: "private",
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch(`/api/projects/${params.id}/settings`)
        if (!response.ok) {
          throw new Error("Failed to fetch settings")
        }
        const data = await response.json()
        setSettings(data)
      } catch (error) {
        console.error("Error fetching settings:", error)
        toast({
          title: "Error",
          description: "Failed to load project settings",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [params.id])

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error("Failed to save settings")
      }

      toast({
        title: "Success",
        description: "Settings saved successfully",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Project Settings</h1>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="space-y-6">
            <div>
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={settings.description}
                onChange={(e) => setSettings({ ...settings, description: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="language">Language</Label>
              <Input
                id="language"
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
              />
            </div>

            <div>
              <Label>Visibility</Label>
              <div className="flex gap-4">
                <Button
                  variant={settings.visibility === "private" ? "default" : "outline"}
                  onClick={() => setSettings({ ...settings, visibility: "private" })}
                >
                  Private
                </Button>
                <Button
                  variant={settings.visibility === "public" ? "default" : "outline"}
                  onClick={() => setSettings({ ...settings, visibility: "public" })}
                >
                  Public
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="advanced">
          <div className="space-y-6">
            <div>
              <Label>Danger Zone</Label>
              <div className="mt-2 space-y-4">
                <Button variant="destructive">Delete Project</Button>
                <p className="text-sm text-muted-foreground">
                  Once you delete a project, there is no going back. Please be certain.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-8">
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  )
} 