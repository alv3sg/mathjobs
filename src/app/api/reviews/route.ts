export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { PrismaClient } from "@/lib/prisma"



// GET /api/reviews - Get reviews (filtered by restaurant or user)
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const restaurantId = searchParams.get("restaurantId")
  const userId = searchParams.get("userId")

  const where: any = {}
  if (restaurantId) where.restaurantId = restaurantId
  if (userId) where.userId = userId

  const reviews = await prisma.review.findMany({
    where,
    include: {
      user: {
        select: { id: true, name: true, avatar: true },
      },
      restaurant: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(reviews)
}

// POST /api/reviews - Create a review
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user?.id

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { restaurantId, rating, comment } = await request.json()

  if (!restaurantId || !rating) {
    return NextResponse.json(
      { error: "restaurantId and rating are required" },
      { status: 400 }
    )
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 })
  }

  try {
    const review = await prisma.review.create({
      data: {
        userId,
        restaurantId,
        rating,
        comment,
      },
    })

    // Update restaurant average rating
    const reviews = await prisma.review.findMany({
      where: { restaurantId },
      select: { rating: true },
    })
    const avg =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length

    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { rating: avg },
    })

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 })
  }
}