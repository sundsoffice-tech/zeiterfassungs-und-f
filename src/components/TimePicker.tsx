import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Input } from '@/componen
import { cn } from '@/lib/utils'
interface TimePickerProps {
  onChange: (value: string) => void
  id?: string

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

  }
  const handleTimeChange = (newValue: string) => {
    o

      setValidationError(validationMessage)
    } else {
     

  const setCurrentTi
   

  }
  const adjustTime = (minutes: number) => {
      setCurrentTime()

    const currentTime = timeToMinutes

      totalMinutes = 0
      totalMinutes = 1439

    const mins = totalMinutes % 60


   

  }
  const handleBlur = () =>

    if (match) {
      const minutes = match[2] ? 
      if (hours >= 0 && hours 
   

    }

    <div className="sp
        <Lab
     

          <Input
            type="text"

            placeholder="HH
            className=
              validationError && 'bord
          />
     

          ) : (
              className={cn(
                disabled && 'opacity-50'

          )}

          <Button
            size="sm"
            onClick={setCurrentTime}
            title="Jetzt (aktuelle Uhrzeit)"
     
   

          <div className="fl
              type="bu

              disabled={disabled}
              cl
              -30
            <Button

              onClick={() => adjustTime(-15)}
              title="15 Minuten zurück"
            >
            </Button>
         
       
     
   

          
              size="sm"
              onC
              title="30 Minuten vorwärts"
            >
            </Bu
        

        <div className="flex items-center
        </div>
    </div>
}









































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
