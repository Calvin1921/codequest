'use server'

import { z } from 'zod'
import { prisma } from '@/server/db'
import { auth, signOut } from '@/lib/auth'
import { withRateLimit } from '@/server/ratelimit'
import { revalidatePath } from 'next/cache'

export type ProfileState = {
  message: string
  errors: {
    name?: string[]
    email?: string[]
    bio?: string[]
  }
  success?: boolean
}

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
})

export const updateProfile = withRateLimit(
  async (prevState: ProfileState, formData: FormData): Promise<ProfileState> => {
    try {
      const session = await auth()

      if (!session?.user?.id) {
        return {
          message: 'You must be logged in to update your profile',
          errors: {},
        }
      }

      const validatedFields = profileSchema.safeParse({
        name: formData.get('name') || undefined,
        email: formData.get('email') || undefined,
        bio: formData.get('bio') || undefined,
      })

      if (!validatedFields.success) {
        return {
          errors: validatedFields.error.flatten().fieldErrors,
          message: 'Invalid fields. Please check your input.',
        }
      }

      const updateData = Object.fromEntries(
        Object.entries(validatedFields.data).filter(([_, v]) => v !== undefined)
      )

      if (Object.keys(updateData).length === 0) {
        return {
          message: 'No changes to save',
          errors: {},
        }
      }

      await prisma.user.update({
        where: { id: session.user.id },
        data: updateData,
      })

      revalidatePath('/settings')

      return {
        message: 'Profile updated successfully',
        errors: {},
        success: true,
      }
    } catch (error) {
      console.error('Profile update error:', error)
      return {
        message: 'Failed to update profile. Please try again.',
        errors: {},
      }
    }
  },
  'api'
)

export const deleteAccount = withRateLimit(
  async (prevState: ProfileState, formData: FormData): Promise<ProfileState> => {
    try {
      const session = await auth()

      if (!session?.user?.id) {
        return {
          message: 'You must be logged in to delete your account',
          errors: {},
        }
      }

      await prisma.user.delete({
        where: { id: session.user.id },
      })

      await signOut({ redirect: true, redirectTo: '/' })

      return {
        message: 'Account deleted successfully',
        errors: {},
        success: true,
      }
    } catch (error) {
      console.error('Account deletion error:', error)
      return {
        message: 'Failed to delete account. Please try again.',
        errors: {},
      }
    }
  },
  'auth'
)
