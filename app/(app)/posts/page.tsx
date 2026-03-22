import { Suspense } from 'react'
import Link from 'next/link'
import { db } from '@/server/db'
import { auth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { PostActions } from './post-actions'

async function PostsList() {
  const session = await auth()
  const posts = await db.post.findMany({
    where: {
      userId: session?.user?.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 20,
  })

  if (posts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No posts yet</CardTitle>
          <CardDescription>
            Create your first post to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/posts/new">
            <Button>Create your first post</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <Card key={post.id}>
          <CardHeader>
            <CardTitle className="line-clamp-1">{post.title}</CardTitle>
            <CardDescription>
              {new Date(post.createdAt).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="line-clamp-3 text-muted-foreground">
              {post.content}
            </p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Link href={`/posts/${post.id}`}>
              <Button variant="outline" size="sm">View</Button>
            </Link>
            <PostActions postId={post.id} />
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

function PostsListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="h-6 w-3/4 animate-pulse bg-muted rounded" />
            <div className="h-4 w-1/2 animate-pulse bg-muted rounded mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse bg-muted rounded" />
              <div className="h-4 w-5/6 animate-pulse bg-muted rounded" />
              <div className="h-4 w-4/6 animate-pulse bg-muted rounded" />
            </div>
          </CardContent>
          <CardFooter>
            <div className="h-8 w-16 animate-pulse bg-muted rounded" />
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

export default function PostsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Posts</h1>
          <p className="text-muted-foreground">
            Manage and view all your posts
          </p>
        </div>
        <Link href="/posts/new">
          <Button>Create Post</Button>
        </Link>
      </div>
      
      <Suspense fallback={<PostsListSkeleton />}>
        <PostsList />
      </Suspense>
    </div>
  )
}