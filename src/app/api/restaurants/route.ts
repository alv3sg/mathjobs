export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { PrismaClient } from "@/lib/prisma"



// GET /api/restaurants - List all restaurants
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Filter parameters
    const city = searchParams.get("city")
    const minRating = parseFloat(searchParams.get("minRating") || "0")
    
    // Pagination
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      rating: { gte: minRating },
    }
    
    if (city) where.city = { equals: city, mode: "insensitive" }

    const [restaurants, total] = await Promise.all([
      prisma.restaurant.findMany({
        where,
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          phone: true,
          email: true,
          website: true,
          image: true,
          rating: true,
          createdAt: true,
          _count: {
            select: {
              jobs: true,
              reviews: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { rating: "desc" },
      }),
      prisma.restaurant.count({ where }),
    ])

    return NextResponse.json({
      restaurants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching restaurants:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/restaurants - Create new restaurant (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Note: Role check simplified for MVP

    const body = await request.json()
    const { name, address, city, phone, email, website, image } = body

    // Validate required fields
    if (!name || !address || !city) {
      return NextResponse.json({ error: "Name, address, and city are required" }, { status: 400 })
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        address,
        city,
        phone,
        email,
        website,
        image,
      },
    })

    return NextResponse.json(restaurant, { status: 201 })
  } catch (error) {
    console.error("Error creating restaurant:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}