import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin } from '@phosphor-icons/react'
import { Project } from '@/lib/types'

interface GeoFencingScreenProps {
  projects: Project[]
}

export function GeoFencingScreen({ projects }: GeoFencingScreenProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" weight="duotone" />
            Geo-Fencing
          </CardTitle>
          <CardDescription>
            Automatic timer control based on geographic location - start/stop when entering/leaving sites
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" weight="duotone" />
            <p className="text-lg font-medium mb-2">Geo-Fencing - Coming Soon</p>
            <p className="text-sm">
              Features: Define geographic zones, auto-start/stop timers, project/task auto-assignment,
              location verification, optional confirmations, background detection
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
