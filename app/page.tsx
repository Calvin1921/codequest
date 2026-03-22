import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold mb-4">
          Welcome to Next.js 15 + React 19
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          A production-ready application with Server Components, Server Actions, and more
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/register">Get Started</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </section>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>React Server Components</CardTitle>
            <CardDescription>
              Server-first architecture for optimal performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Components render on the server by default, sending minimal JavaScript to the client
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Server Actions</CardTitle>
            <CardDescription>
              Mutations without API routes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Direct server functions that can be called from client components
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Suspense Streaming</CardTitle>
            <CardDescription>
              Progressive UI loading
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Stream parts of your UI as they become ready for better perceived performance
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}