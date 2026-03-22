import { auth } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Suspense } from "react"
import prisma from "@/server/db"

async function StatsCards() {
  const session = await auth()
  
  const [postCount, recentPosts] = await Promise.all([
    prisma.post.count({
      where: { authorId: session?.user?.id }
    }),
    prisma.post.findMany({
      where: { authorId: session?.user?.id },
      take: 5,
      orderBy: { createdAt: 'desc' }
    })
  ])

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Posts
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
              Published
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentPosts.filter(p => p.published).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Live posts
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Drafts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentPosts.filter(p => !p.published).length}
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
          {recentPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No posts yet. Create your first post!
            </p>
          ) : (
            <div className="space-y-2">
              {recentPosts.map((post) => (
                <div key={post.id} className="flex items-center justify-between p-2 hover:bg-muted rounded">
                  <div>
                    <p className="font-medium">{post.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {post.published ? "Published" : "Draft"} • {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
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
        </div>
      }>
        <StatsCards />
      </Suspense>
    </div>
  )
}