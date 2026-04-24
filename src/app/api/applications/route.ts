export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { PrismaClient } from "@/lib/prisma"



// GET /api/applications - Get my applications
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user?.id

  const applications = await prisma.application.findMany({
    where: { userId },
    include: {
      job: {
        include: {
          restaurant: {
            select: { id: true, name: true, city: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(applications)
}

// POST /api/applications - Apply for a job
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id
  const body = await request.json()
  const { jobId, coverNote } = body

  if (!jobId) {
    return NextResponse.json({ error: "jobId is required" }, { status: 400 })
  }

  try {
    const application = await prisma.application.create({
      data: {
        userId,
        jobId,
        coverNote: coverNote || null,
        status: "PENDING",
      },
    })

    return NextResponse.json(application, { status: 201 })
  } catch (error: unknown) {
    const prismaError = error as { code?: string }
    if (prismaError.code === "P2002") {
      return NextResponse.json({ error: "Already applied" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to apply" }, { status: 500 })
  }
}