'use server'

import { auth } from "@/lib/auth"
import prisma from "@/server/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const createPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  content: z.string().min(1, "Content is required"),
  published: z.boolean().default(false),
})

export async function createPost(prevState: any, formData: FormData) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  const validatedFields = createPostSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    published: formData.get("published") === "true",
  })

  if (!validatedFields.success) {
    return {
      success: false,
      error: "Invalid form data",
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    const post = await prisma.post.create({
      data: {
        ...validatedFields.data,
        authorId: session.user.id,
      },
    })

    revalidatePath("/posts")
    revalidatePath("/dashboard")

    return { success: true, data: post }
  } catch (error) {
    console.error("Failed to create post:", error)
    return { success: false, error: "Failed to create post" }
  }
}

export async function updatePost(id: string, formData: FormData) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  const post = await prisma.post.findUnique({
    where: { id },
  })

  if (!post || post.authorId !== session.user.id) {
    return { success: false, error: "Post not found or unauthorized" }
  }

  const validatedFields = createPostSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    published: formData.get("published") === "true",
  })

  if (!validatedFields.success) {
    return {
      success: false,
      error: "Invalid form data",
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    const updatedPost = await prisma.post.update({
      where: { id },
      data: validatedFields.data,
    })

    revalidatePath("/posts")
    revalidatePath(`/posts/${id}`)
    revalidatePath("/dashboard")

    return { success: true, data: updatedPost }
  } catch (error) {
    console.error("Failed to update post:", error)
    return { success: false, error: "Failed to update post" }
  }
}

export async function deletePost(id: string) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  const post = await prisma.post.findUnique({
    where: { id },
  })

  if (!post || post.authorId !== session.user.id) {
    return { success: false, error: "Post not found or unauthorized" }
  }

  try {
    await prisma.post.delete({
      where: { id },
    })

    revalidatePath("/posts")
    revalidatePath("/dashboard")

    return { success: true }
  } catch (error) {
    console.error("Failed to delete post:", error)
    return { success: false, error: "Failed to delete post" }
  }
}