export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { PrismaClient } from "@/lib/prisma"



interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/applications/[id] - Get application by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const userId = session.user?.id

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      job: {
        include: {
          restaurant: true,
        },
      },
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  })

  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // Check ownership (or admin/manager)
  if (application.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json(application)
}

// PATCH /api/applications/[id] - Update application status (for managers)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const { status } = await request.json()

  const application = await prisma.application.update({
    where: { id },
    data: { status },
  })

  return NextResponse.json(application)
}

// DELETE /api/applications/[id] - Withdraw application
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const userId = session.user?.id

  const application = await prisma.application.findUnique({
    where: { id },
  })

  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (application.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.application.delete({
    where: { id },
  })

  return NextResponse.json({ success: true })
}