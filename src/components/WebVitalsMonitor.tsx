import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useWebVitals, WebVital } from '@/hooks/use-web-vitals'
import { Speedometer, Heartbeat, ChartLine, Trash, CheckCircle, Warning, XCircle, Lighthouse, Eye, ShieldCheck, MagnifyingGlass } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'

function getVitalColor(rating: WebVital['rating']) {
  switch (rating) {
    case 'good':
      return 'text-green-600 bg-green-100'
    case 'needs-improvement':
      return 'text-yellow-600 bg-yellow-100'
    case 'poor':
      return 'text-red-600 bg-red-100'
  }
}

function getVitalIcon(rating: WebVital['rating']) {
  switch (rating) {
    case 'good':
      return <CheckCircle className="h-5 w-5" weight="fill" />
    case 'needs-improvement':
      return <Warning className="h-5 w-5" weight="fill" />
    case 'poor':
      return <XCircle className="h-5 w-5" weight="fill" />
  }
}

function formatVitalValue(name: WebVital['name'], value: number): string {
  if (name === 'CLS') {
    return value.toFixed(3)
  }
  return `${Math.round(value)}ms`
}

function getScoreColor(score: number) {
  if (score >= 90) return 'text-green-600'
  if (score >= 50) return 'text-yellow-600'
  return 'text-red-600'
}

function getScoreProgress(score: number) {
  if (score >= 90) return 'bg-green-600'
  if (score >= 50) return 'bg-yellow-600'
  return 'bg-red-600'
}

const vitalDescriptions = {
  FCP: 'First Contentful Paint - Zeit bis zum ersten sichtbaren Inhalt',
  LCP: 'Largest Contentful Paint - Zeit bis zum größten sichtbaren Element',
  CLS: 'Cumulative Layout Shift - Visuelle Stabilität der Seite',
  FID: 'First Input Delay - Reaktionszeit auf erste Nutzerinteraktion',
  TTFB: 'Time to First Byte - Server-Antwortzeit',
  INP: 'Interaction to Next Paint - Gesamte Interaktionslatenz'
}

export function WebVitalsMonitor() {
  const { currentVitals, history, recordLighthouseScore, clearHistory } = useWebVitals()

  const latestLighthouseScore = history.lighthouseScores[history.lighthouseScores.length - 1]
  const averageVitals = currentVitals.reduce((acc, vital) => {
    const existing = history.vitals.filter(v => v.name === vital.name)
    if (existing.length === 0) return acc
    
    const sum = existing.reduce((s, v) => s + v.value, 0)
    const avg = sum / existing.length
    
    return {
      ...acc,
      [vital.name]: avg
    }
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Web Vitals & Lighthouse</h2>
          <p className="text-muted-foreground">
            Performance-Metriken und Accessibility-Scores in Echtzeit
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearHistory}
            disabled={history.vitals.length === 0 && history.lighthouseScores.length === 0}
          >
            <Trash className="h-4 w-4 mr-2" />
            Historie löschen
          </Button>
        </div>
      </div>

      <Tabs defaultValue="vitals" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="vitals" className="gap-2">
            <Speedometer className="h-4 w-4" />
            Web Vitals
          </TabsTrigger>
          <TabsTrigger value="lighthouse" className="gap-2">
            <Lighthouse className="h-4 w-4" />
            Lighthouse
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <ChartLine className="h-4 w-4" />
            Historie
          </TabsTrigger>
          <TabsTrigger value="about" className="gap-2">
            <Heartbeat className="h-4 w-4" />
            Info
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vitals" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {currentVitals.map((vital) => (
              <Card key={vital.name}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {vital.name}
                    </CardTitle>
                    <Badge className={getVitalColor(vital.rating)} variant="secondary">
                      <div className="flex items-center gap-1">
                        {getVitalIcon(vital.rating)}
                        <span className="capitalize">{vital.rating === 'needs-improvement' ? 'OK' : vital.rating === 'good' ? 'Gut' : 'Schlecht'}</span>
                      </div>
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    {vitalDescriptions[vital.name]}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">
                        {formatVitalValue(vital.name, vital.value)}
                      </span>
                      {averageVitals[vital.name] && (
                        <span className="text-sm text-muted-foreground">
                          Ø {formatVitalValue(vital.name, averageVitals[vital.name])}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Letzte Messung: {format(vital.timestamp, 'HH:mm:ss', { locale: de })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {currentVitals.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Speedometer className="h-12 w-12 text-muted-foreground mb-4" weight="duotone" />
                <p className="text-sm text-muted-foreground text-center">
                  Keine Web Vitals verfügbar. Interagieren Sie mit der App, um Metriken zu erfassen.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="lighthouse" className="space-y-4">
          {latestLighthouseScore ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Speedometer className="h-5 w-5 text-primary" weight="duotone" />
                    <CardTitle>Performance</CardTitle>
                  </div>
                  <CardDescription>Ladegeschwindigkeit und Reaktionszeiten</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-4xl font-bold ${getScoreColor(latestLighthouseScore.performance)}`}>
                      {latestLighthouseScore.performance}
                    </span>
                    <span className="text-sm text-muted-foreground">/100</span>
                  </div>
                  <Progress value={latestLighthouseScore.performance} className={getScoreProgress(latestLighthouseScore.performance)} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" weight="duotone" />
                    <CardTitle>Accessibility</CardTitle>
                  </div>
                  <CardDescription>Barrierefreiheit und Bedienbarkeit</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-4xl font-bold ${getScoreColor(latestLighthouseScore.accessibility)}`}>
                      {latestLighthouseScore.accessibility}
                    </span>
                    <span className="text-sm text-muted-foreground">/100</span>
                  </div>
                  <Progress value={latestLighthouseScore.accessibility} className={getScoreProgress(latestLighthouseScore.accessibility)} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" weight="duotone" />
                    <CardTitle>Best Practices</CardTitle>
                  </div>
                  <CardDescription>Sicherheit und moderne Standards</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-4xl font-bold ${getScoreColor(latestLighthouseScore.bestPractices)}`}>
                      {latestLighthouseScore.bestPractices}
                    </span>
                    <span className="text-sm text-muted-foreground">/100</span>
                  </div>
                  <Progress value={latestLighthouseScore.bestPractices} className={getScoreProgress(latestLighthouseScore.bestPractices)} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MagnifyingGlass className="h-5 w-5 text-primary" weight="duotone" />
                    <CardTitle>SEO</CardTitle>
                  </div>
                  <CardDescription>Suchmaschinenoptimierung</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-4xl font-bold ${getScoreColor(latestLighthouseScore.seo)}`}>
                      {latestLighthouseScore.seo}
                    </span>
                    <span className="text-sm text-muted-foreground">/100</span>
                  </div>
                  <Progress value={latestLighthouseScore.seo} className={getScoreProgress(latestLighthouseScore.seo)} />
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Lighthouse className="h-12 w-12 text-muted-foreground mb-4" weight="duotone" />
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Keine Lighthouse-Scores verfügbar. Scores werden durch CI/CD Pipeline erfasst.
                </p>
                <Button
                  onClick={() => {
                    recordLighthouseScore({
                      performance: 95,
                      accessibility: 98,
                      bestPractices: 92,
                      seo: 90
                    })
                  }}
                  variant="outline"
                  size="sm"
                >
                  Test-Score hinzufügen
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Web Vitals Historie</CardTitle>
                <CardDescription>
                  {history.vitals.length} Messungen erfasst
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  {history.vitals.length > 0 ? (
                    <div className="space-y-2">
                      {history.vitals.slice().reverse().map((vital, index) => (
                        <div
                          key={`${vital.name}-${vital.timestamp}-${index}`}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card text-card-foreground"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="font-mono">
                              {vital.name}
                            </Badge>
                            <span className="text-sm font-medium">
                              {formatVitalValue(vital.name, vital.value)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getVitalColor(vital.rating)} variant="secondary">
                              {getVitalIcon(vital.rating)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(vital.timestamp, 'dd.MM HH:mm', { locale: de })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                      <ChartLine className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Keine Historie verfügbar</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lighthouse Historie</CardTitle>
                <CardDescription>
                  {history.lighthouseScores.length} Messungen erfasst
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  {history.lighthouseScores.length > 0 ? (
                    <div className="space-y-4">
                      {history.lighthouseScores.slice().reverse().map((score, index) => (
                        <div
                          key={`${score.timestamp}-${index}`}
                          className="p-4 rounded-lg border bg-card text-card-foreground space-y-2"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium">
                              {format(score.timestamp, 'dd.MM.yyyy HH:mm', { locale: de })}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Performance:</span>
                              <span className={`font-medium ${getScoreColor(score.performance)}`}>
                                {score.performance}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Accessibility:</span>
                              <span className={`font-medium ${getScoreColor(score.accessibility)}`}>
                                {score.accessibility}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Best Practices:</span>
                              <span className={`font-medium ${getScoreColor(score.bestPractices)}`}>
                                {score.bestPractices}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">SEO:</span>
                              <span className={`font-medium ${getScoreColor(score.seo)}`}>
                                {score.seo}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Lighthouse className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Keine Historie verfügbar</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="about" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Über Web Vitals & Lighthouse CI</CardTitle>
              <CardDescription>
                Performance-Monitoring und Accessibility-Tracking für Zeiterfassung
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Web Vitals</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Core Web Vitals sind Metriken, die von Google definiert wurden, um die Nutzererfahrung zu messen:
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2">
                    <Badge variant="outline" className="font-mono shrink-0">FCP</Badge>
                    <span className="text-muted-foreground">First Contentful Paint - Erste sichtbare Inhalte</span>
                  </li>
                  <li className="flex gap-2">
                    <Badge variant="outline" className="font-mono shrink-0">LCP</Badge>
                    <span className="text-muted-foreground">Largest Contentful Paint - Größtes sichtbares Element</span>
                  </li>
                  <li className="flex gap-2">
                    <Badge variant="outline" className="font-mono shrink-0">CLS</Badge>
                    <span className="text-muted-foreground">Cumulative Layout Shift - Visuelle Stabilität</span>
                  </li>
                  <li className="flex gap-2">
                    <Badge variant="outline" className="font-mono shrink-0">FID</Badge>
                    <span className="text-muted-foreground">First Input Delay - Erste Interaktionslatenz</span>
                  </li>
                  <li className="flex gap-2">
                    <Badge variant="outline" className="font-mono shrink-0">INP</Badge>
                    <span className="text-muted-foreground">Interaction to Next Paint - Gesamte Interaktionslatenz</span>
                  </li>
                  <li className="flex gap-2">
                    <Badge variant="outline" className="font-mono shrink-0">TTFB</Badge>
                    <span className="text-muted-foreground">Time to First Byte - Server-Antwortzeit</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Lighthouse CI</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Lighthouse CI läuft automatisch in der GitHub Actions Pipeline und überprüft:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" weight="fill" />
                    <span><strong>Performance:</strong> Ladezeiten, Bundle-Größe, Asset-Optimierung</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" weight="fill" />
                    <span><strong>Accessibility:</strong> ARIA-Labels, Kontraste, Tastaturnavigation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" weight="fill" />
                    <span><strong>Best Practices:</strong> HTTPS, Console-Errors, veraltete APIs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" weight="fill" />
                    <span><strong>SEO:</strong> Meta-Tags, strukturierte Daten, Mobile-Friendly</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">Schwellenwerte</h3>
                <div className="grid gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-700">Gut</Badge>
                    <span className="text-muted-foreground">Score ≥ 90 oder Metrik im grünen Bereich</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-100 text-yellow-700">Verbesserung nötig</Badge>
                    <span className="text-muted-foreground">Score 50-89 oder Metrik im gelben Bereich</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-100 text-red-700">Schlecht</Badge>
                    <span className="text-muted-foreground">Score &lt; 50 oder Metrik im roten Bereich</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
