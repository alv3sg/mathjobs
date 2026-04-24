export enum Role {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  WAITER = "WAITER",
  BACKOFFICE = "BACKOFFICE"
}

export interface User {
  id: string
  email: string
  name: string | null
  phone: string | null
  role: Role
  avatar: string | null
  createdAt: Date
  updatedAt: Date
}

export interface UserPreference {
  id: string
  minSalary: number | null
  maxSalary: number | null
  preferredShift: string | null
  commuteRadius: number | null
  remoteOnly: boolean
  userId: string
}