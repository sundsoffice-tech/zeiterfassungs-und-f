import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Input } from '@/components/ui/input'
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

    if (type === 'end' && currentMinutes <= compareMinutes) {
      return 'Endzeit muss nach Startzeit liegen'
    }

    if (type === 'start' && currentMinutes >= compareMinutes) {
      return 'Startzeit muss vor Endzeit liegen'
    }

    return undefined
  }

  const handleTimeChange = (newValue: string) => {
    onChange(newValue)

    if (compareWith && compareType) {
      const validationMessage = validateTimeComparison(newValue, compareWith, compareType)
      setValidationError(validationMessage)
      onValidationChange?.(validationMessage === undefined, validationMessage)
    } else {
      setValidationError(undefined)
      onValidationChange?.(true)
    }
  }

  const setCurrentTime = () => {
    const now = new Date()
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    handleTimeChange(`${hours}:${minutes}`)
  }

  const adjustTime = (minutes: number) => {
    const currentTime = timeToMinutes(value || '00:00')
    let totalMinutes = currentTime + minutes

    if (totalMinutes < 0) {
      totalMinutes = 0
    } else if (totalMinutes >= 1440) {
      totalMinutes = 1439
    }

    const hours = Math.floor(totalMinutes / 60)
    const mins = totalMinutes % 60

    const newTime = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
    handleTimeChange(newTime)
  }

  const handleBlur = () => {
    const match = value.match(/^(\d{1,2}):?(\d{2})?$/)
    if (match) {
      const hours = parseInt(match[1], 10)
      const minutes = match[2] ? parseInt(match[2], 10) : 0
      if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
        const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
        onChange(formatted)
      }
    }
  }

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id} className={cn(disabled && 'opacity-50')}>
          {label}
        </Label>
      )}

      <div className="flex gap-2 items-center">
        <div className="flex-1">
          <Input
            type="text"
            id={id}
            value={value}
            onChange={(e) => handleTimeChange(e.target.value)}
            onBlur={handleBlur}
            disabled={disabled}
            placeholder="HH:MM"
            className={cn(
              'font-mono text-base',
              validationError && 'border-destructive focus-visible:ring-destructive'
            )}
          />
        </div>

        {showShortcuts && !disabled && (
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={setCurrentTime}
              title="Jetzt (aktuelle Uhrzeit)"
              className="h-10 px-3"
            >
              Jetzt
            </Button>
          </div>
        )}
      </div>

      {showShortcuts && !disabled && (
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
            className="h-10 px-2.5"
          >
            +30
          </Button>
        </div>
      )}

      {validationError && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <span>{validationError}</span>
        </div>
      )}
    </div>
  )
}
