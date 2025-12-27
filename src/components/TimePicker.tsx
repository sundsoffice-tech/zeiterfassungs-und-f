import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/butto
import { cn } from '@/lib/utils'
interface TimePickerProps {
  onChange: (value: string) => v

  disabled?: boolean
  compareWith?:
  onValidationChange?: (isValid: bo

  value,
  id,
  disabled = false,
  compareWith,
  onChange,
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

      const validationMessage = validateTimeComparison(newVal
      onValidationChange?.(validationMessage === 
     


    const now = new Date()
    c

  const adjustTime =
   

    } else if (totalMinutes >= 1440) {
    }


    handleTimeChange(newTime)

    const match = value.match(/^(\d{1,2}):?(\d{2})?$/)
      const 
      if (hours >= 0 && hours < 24 
        onChange(formatted)
    }


        <Label htmlFor={id} clas
        </Label>

        <div className="flex-1">
            type="text"
   

            placeholder="HH:MM"
              'font-mono text-base',
            )}

        {showShortcuts && !
            <Button
              size="sm"
              onClick={se
     

          </div>
      </div>

          <Button
            size="sm"
   

          >
          </Button>
            type
            variant="outline"
            disabled={disabled}
            className="h-10 px-2.5"
            -15
          <Button
       
     
   

          
            type="button"
            varia
            disabled={disabled}
            class
            +30
        

        <div className="flex items-center gap-2
        </div>
    </div>
}














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
