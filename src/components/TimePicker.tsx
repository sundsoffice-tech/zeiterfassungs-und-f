import { useState, useEffect } from 'react'
import { Clock, Warning } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface TimePickerProps {
  value: string
  onChange: (value: string) => void
  label?: string
  id?: string
  error?: string
  disabled?: boolean
  showShortcuts?: boolean
  compareWith?: string
  compareType?: 'start' | 'end'
  onValidationChange?: (isValid: boolean, message?: string) => void
}

export function TimePicker({
  value,
  label,
  id,
  error,
  disabled = false,
  showShortcuts = true,
  compareWith,
  compareType,
  onChange,
  onValidationChange,
}: TimePickerProps) {
  const [validationError, setValidationError] = useState<string | undefined>(error)

  useEffect(() => {
    setValidationError(error)
  }, [error])

  useEffect(() => {
    if (compareWith && compareType && value) {
      const validationMessage = validateTimeComparison(value, compareWith, compareType)
      setValidationError(validationMessage)
      onValidationChange?.(validationMessage === undefined, validationMessage)
    }
  }, [value, compareWith, compareType, onValidationChange])

  const timeToMinutes = (time: string): number => {
    if (!time) return 0
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  const validateTimeComparison = (
    current: string,
    compare: string,
    type: 'start' | 'end'
  ): string | undefined => {
    if (!current || !compare) return undefined

    const currentMinutes = timeToMinutes(current)
    const compareMinutes = timeToMinutes(compare)

    if (currentMinutes === 0 && compareMinutes === 0) return undefined

    if (type === 'end' && currentMinutes <= compareMinutes) {
      return 'Endzeit muss nach der Startzeit liegen'
    }

    if (type === 'start' && currentMinutes >= compareMinutes) {
      return 'Startzeit muss vor der Endzeit liegen'
    }

    return undefined
  }

  const handleTimeChange = (newValue: string) => {
    const sanitized = newValue.replace(/[^\d:]/g, '')
    onChange(sanitized)

    if (compareWith && compareType) {
      const validationMessage = validateTimeComparison(sanitized, compareWith, compareType)
      setValidationError(validationMessage)
      onValidationChange?.(validationMessage === undefined, validationMessage)
    } else {
      setValidationError(undefined)
      onValidationChange?.(true)
    }
  }

  const setCurrentTime = () => {
    const now = new Date()
    const formatted = format(now, 'HH:mm')
    onChange(formatted)
    setValidationError(undefined)
    onValidationChange?.(true)
  }

  const adjustTime = (minutes: number) => {
    if (!value) {
      setCurrentTime()
      return
    }

    const currentTime = timeToMinutes(value)
    let totalMinutes = currentTime + minutes

    if (totalMinutes < 0) {
      totalMinutes = 0
    } else if (totalMinutes >= 1440) {
      totalMinutes = 1439
    }

    const hours = Math.floor(totalMinutes / 60)
    const mins = totalMinutes % 60
    const formatted = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`

    onChange(formatted)

    if (compareWith && compareType) {
      const validationMessage = validateTimeComparison(formatted, compareWith, compareType)
      setValidationError(validationMessage)
      onValidationChange?.(validationMessage === undefined, validationMessage)
    }
  }

  const handleBlur = () => {
    if (!value) return

    const match = value.match(/^(\d{1,2}):?(\d{0,2})$/)
    if (match) {
      const hours = parseInt(match[1], 10)
      const minutes = match[2] ? parseInt(match[2], 10) : 0

      if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
        const formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
        if (formatted !== value) {
          onChange(formatted)
        }
      }
    }
  }

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
      )}
      <div className="flex items-start gap-2">
        <div className="relative flex-1">
          <Input
            id={id}
            type="text"
            value={value}
            onChange={(e) => handleTimeChange(e.target.value)}
            onBlur={handleBlur}
            placeholder="HH:MM"
            disabled={disabled}
            className={cn(
              'pr-10',
              validationError && 'border-destructive focus-visible:ring-destructive'
            )}
          />
          {validationError ? (
            <Warning
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive"
              weight="fill"
            />
          ) : (
            <Clock
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground',
                disabled && 'opacity-50'
              )}
              weight="regular"
            />
          )}
        </div>

        {showShortcuts && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={setCurrentTime}
            disabled={disabled}
            title="Jetzt (aktuelle Uhrzeit)"
            className="h-10 px-3 shrink-0"
          >
            <Clock className="h-4 w-4" weight="bold" />
          </Button>
        )}

        {showShortcuts && (
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => adjustTime(-30)}
              disabled={disabled}
              title="30 Minuten zurück"
              className="h-10 px-2.5"
            >
              -30
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => adjustTime(-15)}
              disabled={disabled}
              title="15 Minuten zurück"
              className="h-10 px-2.5"
            >
              -15
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => adjustTime(15)}
              disabled={disabled}
              title="15 Minuten vorwärts"
              className="h-10 px-2.5"
            >
              +15
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => adjustTime(30)}
              disabled={disabled}
              title="30 Minuten vorwärts"
              className="h-10 px-2.5 text-xs"
            >
              +30
            </Button>
          </div>
        )}
      </div>

      {validationError && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <span>{validationError}</span>
        </div>
      )}
    </div>
  )
}
