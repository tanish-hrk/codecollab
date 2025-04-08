import { NextRequest, NextResponse } from "next/server"

const PISTON_API = "https://emkc.org/api/v2/piston"

interface LanguageConfig {
  extension: string
  className?: string
  wrapCode?: (code: string) => string
}

const LANGUAGE_CONFIG: Record<string, LanguageConfig> = {
  javascript: {
    extension: "js",
  },
  typescript: {
    extension: "ts",
  },
  python: {
    extension: "py",
  },
  java: {
    extension: "java",
    className: "Main",
    wrapCode: (code: string) => {
      if (!code.includes("class")) {
        return `public class Main {
          ${code}
        }`
      }
      return code
    },
  },
  csharp: {
    extension: "cs",
    wrapCode: (code: string) => {
      if (!code.includes("namespace") && !code.includes("class")) {
        return `using System;
        public class Program {
          public static void Main(string[] args) {
            ${code}
          }
        }`
      }
      return code
    },
  },
  php: {
    extension: "php",
    wrapCode: (code: string) => {
      if (!code.startsWith("<?php")) {
        return `<?php\n${code}`
      }
      return code
    },
  },
}

export async function POST(req: NextRequest) {
  try {
    const { language, sourceCode, version } = await req.json()
    const config = LANGUAGE_CONFIG[language]

    if (!config) {
      throw new Error(`Unsupported language: ${language}`)
    }

    // Process the source code based on language requirements
    let processedCode = config.wrapCode ? config.wrapCode(sourceCode) : sourceCode

    // For Java, ensure the class name matches the expected name
    if (language === "java" && !processedCode.includes("class Main")) {
      const classMatch = processedCode.match(/class\s+(\w+)/)
      if (classMatch) {
        processedCode = processedCode.replace(
          new RegExp(`class\\s+${classMatch[1]}`),
          "class Main"
        )
      }
    }

    const response = await fetch(`${PISTON_API}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        language,
        version,
        files: [
          {
            name: `main.${config.extension}`,
            content: processedCode,
          },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to execute code")
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error executing code:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to execute code" },
      { status: 500 }
    )
  }
} 