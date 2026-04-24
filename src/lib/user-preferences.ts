import { prisma } from "./prisma"

export async function getUserPreferences(userId: string) {
  return prisma.userPreference.findUnique({ where: { userId } })
}

export async function upsertUserPreferences(
  userId: string,
  data: {
    minSalary?: number
    maxSalary?: number
    preferredShift?: string
    commuteRadius?: number
    remoteOnly?: boolean
  }
) {
  return prisma.userPreference.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data }
  })
}

export async function deleteUserPreferences(userId: string) {
  return prisma.userPreference.delete({ where: { userId } })
}