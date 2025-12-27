import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Clock, Warning } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
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

    if (type === 'start' && currentMinutes >= compareMinutes) {
      return 'Startzeit muss vor der Endzeit liegen'
    }

    if (type === 'end' && currentMinutes <= compareMinutes) {
      return 'Endzeit muss nach der Startzeit liegen'
    }

    return undefined
  }

  const handleTimeChange = (newValue: string) => {
    const sanitized = newValue.replace(/[^0-9:]/g, '')
    onChange(sanitized)

    if (compareWith && compareType && sanitized) {
      const validationMessage = validateTimeComparison(sanitized, compareWith, compareType)
      setValidationError(validationMessage)
      onValidationChange?.(validationMessage === undefined, validationMessage)
    }
  }

  const setNow = () => {
    const timeStr = format(new Date(), 'HH:mm')
    onChange(timeStr)
    setValidationError(undefined)
  }

  const adjustTime = (minutes: number) => {
    if (!value) {
      setNow()
      return
    }

    const currentTime = timeToMinutes(value)
    let totalMinutes = currentTime + minutes

    if (totalMinutes < 0) {
      totalMinutes = 1440 + totalMinutes
    } else if (totalMinutes >= 1440) {
      totalMinutes = totalMinutes - 1440
    }

    const hours = Math.floor(totalMinutes / 60)
    const mins = totalMinutes % 60
    const formatted = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`

    onChange(formatted)

    if (compareWith && compareType) {
      const validationMessage = validateTimeComparison(formatted, compareWith, compareType)
      setValidationError(validationMessage)
      onValidationChange?.(validationMessage === undefined, validationMessage)
    }
  }

  const handleBlur = () => {
    if (!value) return

    const match = value.match(/^(\d{1,2}):?(\d{2})?$/)
    if (match) {
      const hours = parseInt(match[1], 10)
      const minutes = match[2] ? parseInt(match[2], 10) : 0

      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
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
            disabled={disabled}
            placeholder="HH:MM"
            className={cn(
              'font-mono pr-10',
              validationError && 'border-destructive focus-visible:ring-destructive'
            )}
          />
          {validationError ? (
            <Warning
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive',
                disabled && 'opacity-50'
              )}
              weight="fill"
            />
          ) : (
            <Clock
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground',
                disabled && 'opacity-50'
              )}
            />
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={setNow}
          disabled={disabled}
          className="h-10 px-3"
          title="Jetzt (aktuelle Uhrzeit)"
        >
          <Clock className="h-4 w-4" weight="bold" />
        </Button>

        {showShortcuts && (
          <div className="flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => adjustTime(-30)}
              disabled={disabled}
              className="h-10 px-2.5 text-xs"
              title="30 Minuten zurück"
            >
              -30
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => adjustTime(-15)}
              disabled={disabled}
              className="h-10 px-2.5 text-xs"
              title="15 Minuten zurück"
            >
              -15
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => adjustTime(15)}
              disabled={disabled}
              className="h-10 px-2.5 text-xs"
              title="15 Minuten vor"
            >
              +15
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => adjustTime(30)}
              disabled={disabled}
              className="h-10 px-2.5 text-xs"
              title="30 Minuten vor"
            >
              +30
            </Button>
          </div>
        )}
      </div>

      {validationError && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <Warning className="h-4 w-4" weight="fill" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  )
}
