"use client"

import { useState, useEffect } from "react"

interface FetchOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE"
  body?: any
  headers?: Record<string, string>
}

export function useApi<T>(url: string, options?: FetchOptions) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(url, {
          method: options?.method || "GET",
          headers: {
            "Content-Type": "application/json",
            ...options?.headers,
          },
          body: options?.body ? JSON.stringify(options.body) : undefined,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "An error occurred")
        }

        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("An unknown error occurred"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [url, options?.method, options?.body, JSON.stringify(options?.headers)])

  return { data, error, isLoading }
}

export async function fetchApi<T>(url: string, options?: FetchOptions): Promise<T> {
  const response = await fetch(url, {
    method: options?.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || "An error occurred")
  }

  return response.json()
}

export function useProject(projectId: string) {
  return useApi(`/api/projects/${projectId}`)
}

export function useProjectFiles(projectId: string) {
  return useApi(`/api/projects/${projectId}/files`)
}

export function useProjectCollaborators(projectId: string) {
  return useApi(`/api/projects/${projectId}/collaborators`)
}

export function useProjectMessages(projectId: string, limit = 50) {
  return useApi(`/api/projects/${projectId}/messages?limit=${limit}`)
}

export function useProjectActivities(projectId: string, limit = 20) {
  return useApi(`/api/projects/${projectId}/activities?limit=${limit}`)
}

