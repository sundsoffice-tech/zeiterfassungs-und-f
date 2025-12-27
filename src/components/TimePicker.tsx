import { useState, useEffect } from 'react'
import { Clock, Warning } from '@phosphor-ico
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


      return 'Endzeit muss nach der Startzeit liegen


  const handleTimeChange = (newValue: string) => {
    onChange(sanitized)
    i

    }


    setValidationError(undefined)

    if (!value) {


    let totalMinutes = currentTime + minutes
    if (totalMinutes < 0) {
    } else if (totalMinutes >= 1440) {
    }
   

    onChange(formatted)
    if (compareWith && compareType) {
      setValidationEr
    }


    const match = value.match(/^(\d{1,2}):?
      const hours

        cons
     

  }
  return (

          {label}
      )}
      <div className="flex items-start
          <Input
     

            disabled={disabled}
            className={cn(
              validationError && 'border-destructive focus-visible:ring-destructive'

            <Warning

              )}
            />
            <Clock
                'absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-
     
   

          type="button"
          size="sm"

          title="Jetzt (aktuelle Uhrzeit)"
          <Clock

          <div className="flex gap-1">

              size="sm"
              disabled={disabled}
              title="30 Minuten zu
              -30
         
       
     
   

          
              type="button"
              siz
              disabled={disabled}
              tit
              +1
        

              onClick={() => adjustTime(30)}
              className="h-10 px-2.5 text
            >
            </Butto
        )}

        <div className="flex items-center gap-2 text-sm text-d
          <span>{validationErro
      )}
  )






























































































