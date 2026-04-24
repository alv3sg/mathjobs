import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// GET /api/jobs - List all jobs with filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const { searchParams } = new URL(request.url)

    const status = searchParams.get("status")
    const shift = searchParams.get("shift")
    const city = searchParams.get("city")
    const restaurantId = searchParams.get("restaurantId")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const order = searchParams.get("order") || "desc"

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (shift) where.shift = shift
    if (city) where.city = { equals: city, mode: "insensitive" }
    if (restaurantId) where.restaurantId = restaurantId

    // Non-authenticated users can only see OPEN jobs
    if (!session) {
      where.status = "OPEN"
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          restaurant: {
            select: { id: true, name: true, city: true, image: true },
          },
          _count: { select: { applications: true } },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
      }),
      prisma.job.count({ where }),
    ])

    return NextResponse.json({
      jobs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error("Error fetching jobs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/jobs - Create new job
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, location, salary, shift, date, restaurantId } = body

    if (!title || !description || !location || !salary || !shift || !date || !restaurantId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } })

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 })
    }

    const job = await prisma.job.create({
      data: {
        title,
        description,
        location,
        salary: parseFloat(salary),
        shift: shift.toUpperCase(),
        date: new Date(date),
        restaurantId,
        postedById: session.user.id,
      },
    })

    return NextResponse.json(job, { status: 201 })
  } catch (error) {
    console.error("Error creating job:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}