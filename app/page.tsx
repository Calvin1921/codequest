import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="text-center py-20">
        <h1 className="text-5xl font-extrabold tracking-tight text-foreground mb-6">
          Master Coding Interviews,
          <br />
          Level Up Your Career
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          A gamified platform for senior engineers to sharpen interview skills.
          Tackle real-world coding challenges, get instant AI-powered feedback,
          and track your progress with XP, streaks, and leaderboards.
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

      <section>
        <h2 className="text-2xl font-bold text-center text-foreground mb-8">
          Everything you need to ace the interview
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Live Coding Challenges</CardTitle>
              <CardDescription>
                Built-in Monaco Editor for a real IDE experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Solve algorithms, data structures, and system design problems in
                a full-featured code editor with syntax highlighting, autocomplete,
                and multi-language support.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Feedback</CardTitle>
              <CardDescription>
                Instant analysis from Claude
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Get detailed feedback on code quality, time complexity, edge cases,
                and alternative approaches — like having a senior engineer review
                every solution.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gamified Learning</CardTitle>
              <CardDescription>
                XP, streaks, and leaderboards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Earn experience points for each challenge, maintain daily streaks
                to build consistency, and compete on the leaderboard to stay
                motivated throughout your prep.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
