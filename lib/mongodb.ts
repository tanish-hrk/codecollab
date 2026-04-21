import { MongoClient, ServerApiVersion } from "mongodb"

const uri = process.env.MONGODB_URI || ""

if (!uri) {
  console.warn("Warning: MONGODB_URI is not set. MongoDB features will not work.")
}

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
}

let clientPromise: Promise<MongoClient>

if (!uri) {
  // Return a promise that rejects only when actually awaited (not at import time)
  clientPromise = Promise.reject(new Error("MONGODB_URI is not set. Please add it to .env.local"))
  // Prevent unhandled rejection warning — it will be caught at call sites
  clientPromise.catch(() => {})
} else if (process.env.NODE_ENV === "development") {
  // In development, use a global variable so the value is preserved
  // across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    const client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  const client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export default clientPromise
