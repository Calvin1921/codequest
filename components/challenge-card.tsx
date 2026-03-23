import Link from "next/link"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DifficultyBadge } from "@/components/difficulty-badge"
import { CheckCircle2, Circle, Lock } from "lucide-react"
import { cn } from "@/lib/utils"

type ChallengeStatus = "completed" | "in-progress" | "locked" | "available"

interface ChallengeCardProps {
  id: string
  title: string
  description: string
  difficulty: "easy" | "medium" | "hard"
  category: string
  xp: number
  status: ChallengeStatus
}

const statusConfig: Record<
  ChallengeStatus,
  { icon: React.ReactNode; label: string; className: string }
> = {
  completed: {
    icon: <CheckCircle2 className="size-4" />,
    label: "Completed",
    className: "text-green-600 dark:text-green-400",
  },
  "in-progress": {
    icon: <Circle className="size-4" />,
    label: "In Progress",
    className: "text-amber-600 dark:text-amber-400",
  },
  available: {
    icon: <Circle className="size-4" />,
    label: "Available",
    className: "text-muted-foreground",
  },
  locked: {
    icon: <Lock className="size-4" />,
    label: "Locked",
    className: "text-muted-foreground",
  },
}

export function ChallengeCard({
  id,
  title,
  description,
  difficulty,
  category,
  xp,
  status,
}: ChallengeCardProps) {
  const statusInfo = statusConfig[status]
  const isLocked = status === "locked"

  const content = (
    <Card
      className={cn(
        "transition-shadow hover:shadow-md",
        isLocked && "opacity-60"
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{title}</CardTitle>
          <div
            className={cn(
              "flex items-center gap-1 text-xs",
              statusInfo.className
            )}
          >
            {statusInfo.icon}
            <span>{statusInfo.label}</span>
          </div>
        </div>
        <CardDescription className="line-clamp-2">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <DifficultyBadge difficulty={difficulty} />
          <Badge variant="secondary">{category}</Badge>
          <span className="text-muted-foreground ml-auto text-sm font-medium">
            {xp} XP
          </span>
        </div>
      </CardContent>
    </Card>
  )

  if (isLocked) {
    return content
  }

  return (
    <Link href={`/challenges/${id}`} className="block">
      {content}
    </Link>
  )
}
