'use server'

import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/server/db'
import { withRateLimit } from '@/server/ratelimit'
import { signIn } from '@/lib/auth'

export type RegisterState = {
  message: string
  errors: {
    name?: string[]
    email?: string[]
    password?: string[]
  }
  success?: boolean
}

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const registerUser = withRateLimit(
  async (prevState: RegisterState, formData: FormData): Promise<RegisterState> => {
    try {
      const validatedFields = registerSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
      })

      if (!validatedFields.success) {
        return {
          errors: validatedFields.error.flatten().fieldErrors,
          message: 'Invalid fields. Please check your input.',
        }
      }

      const { name, email, password } = validatedFields.data

      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return {
          errors: { email: ['Email already registered'] },
          message: 'An account with this email already exists.',
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10)

      await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      })

      await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      return {
        message: '',
        errors: {},
        success: true,
      }
    } catch (error) {
      console.error('Registration error:', error)
      return {
        message: 'Something went wrong. Please try again.',
        errors: {},
      }
    }
  },
  'auth'
)
