import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    // проверка
    if (!email || !password) {
      return new Response("Email and password required", { status: 400 })
    }

    // проверка на существование
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return new Response("User already exists", { status: 400 })
    }

    // хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10)

    // создаём пользователя
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword
      }
    })

    return Response.json(user)

  } catch (error) {
    return new Response("Error", { status: 500 })
  }
}