import { NextRequest } from "next/server"
import { headers } from "next/headers"

// Force dynamic route to avoid build-time Prisma initialization
export const dynamic = "force-dynamic"

// Lazy load auth handlers at runtime only
export async function GET(request: NextRequest) {
  const { handlers } = await import("@/auth")
  return handlers.GET(request as any)
}

export async function POST(request: NextRequest) {
  const { handlers } = await import("@/auth")
  return handlers.POST(request as any)
}