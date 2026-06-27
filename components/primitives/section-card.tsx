import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
  bleed = false,
}: {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  contentClassName?: string
  bleed?: boolean
}) {
  return (
    <Card className={cn("shadow-card", className)}>
      {(title || action) && (
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            {title && <CardTitle className="text-base">{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </CardHeader>
      )}
      <CardContent className={cn(bleed && "px-0 pb-0", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  )
}
