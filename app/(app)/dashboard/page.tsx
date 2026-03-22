import { auth } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Suspense } from "react"
import prisma from "@/server/db"
import Link from "next/link"

async function StatsCards() {
  const session = await auth()

  const [postCount, publishedCount, draftCount, recentPosts] = await Promise.all([
    prisma.post.count({
      where: { authorId: session?.user?.id }
    }),
    prisma.post.count({
      where: { authorId: session?.user?.id, published: true }
    }),
    prisma.post.count({
      where: { authorId: session?.user?.id, published: false }
    }),
    prisma.post.findMany({
      where: { authorId: session?.user?.id },
      take: 5,
      orderBy: { createdAt: 'desc' }
    })
  ])

  if (postCount === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-12">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">No posts yet</CardTitle>
          <CardDescription>
            Get started by creating your first post.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/posts/new"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            Create your first post
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              📝 Total Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{postCount}</div>
            <p className="text-xs text-muted-foreground">
              All time posts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              ✅ Published
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {publishedCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Live posts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              📋 Drafts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {draftCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Unpublished posts
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Posts</CardTitle>
          <CardDescription>
            Your latest posts and drafts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentPosts.map((post) => (
              <Link key={post.id} href="/posts" className="block">
                <div className="flex items-center justify-between p-2 hover:bg-muted rounded">
                  <div>
                    <p className="font-medium">{post.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {post.published ? "Published" : "Draft"} • {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export default async function DashboardPage() {
  const session = await auth()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session?.user?.name || session?.user?.email}!
        </p>
      </div>

      <Suspense fallback={
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader className="h-20 animate-pulse bg-muted" />
                <CardContent className="h-16 animate-pulse bg-muted mt-2" />
              </Card>
            ))}
          </div>
          <Card className="mt-6">
            <CardHeader className="h-16 animate-pulse bg-muted" />
            <CardContent className="h-40 animate-pulse bg-muted mt-2" />
          </Card>
        </div>
      }>
        <StatsCards />
      </Suspense>
    </div>
  )
}
