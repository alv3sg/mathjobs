export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { PrismaClient } from "@/lib/prisma"



interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/reviews/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const review = await prisma.review.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, avatar: true },
      },
      restaurant: {
        select: { id: true, name: true },
      },
    },
  })

  if (!review) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(review)
}

// DELETE /api/reviews/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const userId = session.user?.id

  const review = await prisma.review.findUnique({
    where: { id },
  })

  if (!review) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (review.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.review.delete({
    where: { id },
  })

  return NextResponse.json({ success: true })
}