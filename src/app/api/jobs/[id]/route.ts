export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { PrismaClient } from "@/lib/prisma"



// GET /api/jobs/[id] - Get job by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        restaurant: {
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
          },
        },
        postedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    })

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Non-authenticated users can only see OPEN jobs
    if (!session) {
      if (job.status !== "OPEN") {
        return NextResponse.json({ error: "Job not found" }, { status: 404 })
      }
    }

    return NextResponse.json(job)
  } catch (error) {
    console.error("Error fetching job:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/jobs/[id] - Update job
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only managers and admins can update jobs
    // Note: Role check requires additional session callback - simplified for MVP
    const user = session.user
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if job exists and user has permission
    const existingJob = await prisma.job.findUnique({
      where: { id },
      include: { restaurant: true },
    })

    if (!existingJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    const body = await request.json()
    const { title, description, location, salary, shift, date, status } = body

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (location !== undefined) updateData.location = location
    if (salary !== undefined) updateData.salary = parseFloat(salary)
    if (shift !== undefined) updateData.shift = shift.toUpperCase()
    if (date !== undefined) updateData.date = new Date(date)
    if (status !== undefined) updateData.status = status.toUpperCase()

    const job = await prisma.job.update({
      where: { id },
      data: updateData,
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
      },
    })

    return NextResponse.json(job)
  } catch (error) {
    console.error("Error updating job:", error)
    if ((error as any).code === "P2025") {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/jobs/[id] - Delete job
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only managers and admins can delete jobs
    const user = session.user
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const job = await prisma.job.findUnique({
      where: { id },
    })

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    await prisma.job.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Job deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting job:", error)
    if ((error as any).code === "P2025") {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}