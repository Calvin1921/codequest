'use client'

import { useOptimistic, useTransition } from 'react'
import { deletePost } from '@/server/actions/posts'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export function PostActions({ postId }: { postId: string }) {
  const [isPending, startTransition] = useTransition()
  const [optimisticDeleted, setOptimisticDeleted] = useOptimistic(false)

  const handleDelete = () => {
    startTransition(async () => {
      setOptimisticDeleted(true)
      await deletePost(postId)
    })
  }

  if (optimisticDeleted) {
    return (
      <div className="text-sm text-muted-foreground">
        Deleting...
      </div>
    )
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={isPending}>
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your post.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}