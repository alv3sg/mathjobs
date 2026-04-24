export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { PrismaClient } from "@/lib/prisma"



// GET /api/restaurants/[id] - Get restaurant by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            jobs: true,
            reviews: true,
          },
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        jobs: {
          where: { status: "OPEN" },
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            location: true,
            salary: true,
            shift: true,
            date: true,
          },
        },
      },
    })

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 })
    }

    return NextResponse.json(restaurant)
  } catch (error) {
    console.error("Error fetching restaurant:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/restaurants/[id] - Update restaurant
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can update restaurants
    // Note: Role check simplified for MVP

    const body = await request.json()
    const { name, address, city, phone, email, website, image } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (address !== undefined) updateData.address = address
    if (city !== undefined) updateData.city = city
    if (phone !== undefined) updateData.phone = phone
    if (email !== undefined) updateData.email = email
    if (website !== undefined) updateData.website = website
    if (image !== undefined) updateData.image = image

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(restaurant)
  } catch (error) {
    console.error("Error updating restaurant:", error)
    if ((error as any).code === "P2025") {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/restaurants/[id] - Delete restaurant (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can delete restaurants
    // Note: Role check simplified for MVP

    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: { _count: { select: { jobs: true } } },
    })

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 })
    }

    // Prevent deletion if restaurant has active jobs
    if (restaurant._count.jobs > 0) {
      return NextResponse.json(
        { error: "Cannot delete restaurant with active jobs" },
        { status: 400 }
      )
    }

    await prisma.restaurant.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Restaurant deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting restaurant:", error)
    if ((error as any).code === "P2025") {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}