'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { createPost } from '@/server/actions/posts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Creating...' : 'Create Post'}
    </Button>
  )
}

interface CreatePostModalProps {
  isModal?: boolean
}

export function CreatePostModal({ isModal = false }: CreatePostModalProps) {
  const router = useRouter()
  const [state, formAction] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await createPost(prevState, formData)
      if (result.success) {
        router.push('/posts')
        router.refresh()
      }
      return result
    },
    {
      success: false,
      error: '',
      errors: {},
    }
  )

  const form = (
    <form action={formAction}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            placeholder="Enter post title"
            required
          />
          {state?.errors?.title && (
            <p className="text-sm text-red-500">{state.errors.title}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="content">Content</Label>
          <Textarea
            id="content"
            name="content"
            placeholder="Write your post content..."
            className="min-h-[200px]"
            required
          />
          {state?.errors?.content && (
            <p className="text-sm text-red-500">{state.errors.content}</p>
          )}
        </div>
        {state?.error && !state.success && (
          <p className="text-sm text-red-500">{state.error}</p>
        )}
      </div>
      {isModal ? (
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <SubmitButton />
        </DialogFooter>
      ) : (
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/posts')}
          >
            Cancel
          </Button>
          <SubmitButton />
        </CardFooter>
      )}
    </form>
  )

  if (isModal) {
    return (
      <Dialog open onOpenChange={() => router.back()}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Post</DialogTitle>
            <DialogDescription>
              Share your thoughts with the world
            </DialogDescription>
          </DialogHeader>
          {form}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create New Post</CardTitle>
          <CardDescription>
            Share your thoughts with the world
          </CardDescription>
        </CardHeader>
        <CardContent>
          {form}
        </CardContent>
      </Card>
    </div>
  )
}