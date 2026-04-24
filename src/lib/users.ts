import { prisma } from "./prisma"
import type { Role } from "@/types/user"

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } })
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } })
}

export async function createUser(data: {
  email: string
  name?: string
  phone?: string
  role?: Role
  avatar?: string
}) {
  return prisma.user.create({ data })
}

export async function updateUser(
  id: string,
  data: {
    name?: string
    phone?: string
    role?: Role
    avatar?: string
  }
) {
  return prisma.user.update({ where: { id }, data })
}

export async function deleteUser(id: string) {
  return prisma.user.delete({ where: { id } })
}

export async function listUsers(options?: {
  role?: Role
  page?: number
  limit?: number
}) {
  const { role, page = 1, limit = 20 } = options || {}
  const where = role ? { role } : {}

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" }
    }),
    prisma.user.count({ where })
  ])

  return { users, total, page, limit }
}