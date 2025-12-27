import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Clock, Warning } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

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
  onChange,
  label,
  id,
  error,
  disabled = false,
  showShortcuts = true,
  compareWith,
  compareType,
  onValidationChange
}: TimePickerProps) {
  const [validationError, setValidationError] = useState<string | undefined>(error)

  useEffect(() => {
    setValidationError(error)
  }, [error])

  useEffect(() => {
    if (compareWith && value) {
      const validationMessage = validateTimeComparison(value, compareWith, compareType)
      setValidationError(validationMessage)
      onValidationChange?.(validationMessage === undefined, validationMessage)
    }
  }, [value, compareWith, compareType, onValidationChange])

  const parseTime = (timeStr: string): { hours: number; minutes: number } | null => {
    const match = timeStr.match(/^(\d{1,2}):(\d{2})$/)
    if (!match) return null
    const hours = parseInt(match[1], 10)
    const minutes = parseInt(match[2], 10)
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null
    return { hours, minutes }
  }

  const timeToMinutes = (timeStr: string): number => {
    const time = parseTime(timeStr)
    if (!time) return 0
    return time.hours * 60 + time.minutes
  }

  const validateTimeComparison = (
    current: string,
    compare: string,
    type?: 'start' | 'end'
  ): string | undefined => {
    if (!type || !compare) return undefined

    const currentMinutes = timeToMinutes(current)
    const compareMinutes = timeToMinutes(compare)

    if (currentMinutes === 0 || compareMinutes === 0) return undefined

    if (type === 'end' && currentMinutes <= compareMinutes) {
      return 'Endzeit muss nach der Startzeit liegen'
    }

    if (type === 'start' && currentMinutes >= compareMinutes) {
      return 'Startzeit muss vor der Endzeit liegen'
    }

    return undefined
  }

  const handleTimeChange = (newValue: string) => {
    const sanitized = newValue.replace(/[^0-9:]/g, '')
    onChange(sanitized)

    if (compareWith) {
      const validationMessage = validateTimeComparison(sanitized, compareWith, compareType)
      setValidationError(validationMessage)
      onValidationChange?.(validationMessage === undefined, validationMessage)
    }
  }

  const setNow = () => {
    const now = new Date()
    const timeStr = format(now, 'HH:mm')
    onChange(timeStr)
    setValidationError(undefined)
    onValidationChange?.(true)
  }

  const adjustTime = (minutes: number) => {
    const currentTime = parseTime(value)
    if (!currentTime) {
      const now = new Date()
      const roundedMinutes = Math.ceil(now.getMinutes() / 15) * 15
      now.setMinutes(roundedMinutes)
      onChange(format(now, 'HH:mm'))
      return
    }

    let totalMinutes = currentTime.hours * 60 + currentTime.minutes + minutes
    
    if (totalMinutes < 0) totalMinutes = 0
    if (totalMinutes >= 24 * 60) totalMinutes = 24 * 60 - 1

    const newHours = Math.floor(totalMinutes / 60)
    const newMinutes = totalMinutes % 60
    const newTimeStr = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`
    
    onChange(newTimeStr)
    
    if (compareWith) {
      const validationMessage = validateTimeComparison(newTimeStr, compareWith, compareType)
      setValidationError(validationMessage)
      onValidationChange?.(validationMessage === undefined, validationMessage)
    }
  }

  const handleBlur = () => {
    if (!value) return

    const parsed = parseTime(value)
    if (parsed) {
      const formatted = `${parsed.hours.toString().padStart(2, '0')}:${parsed.minutes.toString().padStart(2, '0')}`
      if (formatted !== value) {
        onChange(formatted)
      }
    }
  }

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id} className={cn(validationError && 'text-destructive')}>
          {label}
        </Label>
      )}
      
      <div className="flex items-center gap-2">
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
              'font-mono pr-10',
              validationError && 'border-destructive focus-visible:ring-destructive'
            )}
            maxLength={5}
          />
          <Clock
            className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4',
              validationError ? 'text-destructive' : 'text-muted-foreground'
            )}
            weight="duotone"
          />
        </div>

        {showShortcuts && (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={setNow}
              disabled={disabled}
              className="h-10 px-3"
              title="Aktuelle Uhrzeit"
            >
              <Clock className="h-4 w-4" weight="duotone" />
            </Button>
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
