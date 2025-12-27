import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Clock, Warning } from '@phosphor-icons
import { format } from 'date-fns'
interface TimePickerProps {
  onChange: (value: string) => v
  id?: string

  compareWith?: string
  onValidationC

  value,
  label,
  error,
  showShortcuts = tr
  compareType,
}: TimePickerProps) {

    setValidationError(error)


      setValidationError(val
    }

    cons
    c
    if (
  }
  const timeToMinutes =
    if (!time)
  }
  const validateTime
    compare: string,
  ): string | undefined => {

    const compareMi
    if (currentMinutes === 0 
    if (type 

    if (type === 's
    }
    return undefined

    const sanitized = newValue.replace(/[^0-9:]/g, '')

      const validationMessage = validateTimeComparison(sani

  }
  const setNow = () => {
    const timeStr = format(
    setValidationError(undefined)
  }
  const adjustTime = (minutes: number) => {
    if (!currentTime) {
   

    }
    let totalMinutes = currentTime.
    if (totalMinutes < 

   

    
      const validati
      onValidationCh
  }
  const handleBlur = () => {


      if (formatted !== value) {
      }

  return (

          {label}
      )}
     

            type="text"
            onChange={(e) => handleTimeChange(e.targ
     

              valida
   

              'absolute right-3 top-1/2 -translate
            )}
          />

          <div classNa
              type="button"
              size="sm"
              disabled={disabled}
     
   

              variant="o
              onClick={() 
              className="h-10 px-2.5 tex
            >
            </Button>
              type="button"
   

              title="15 Minuten zurück"
              -15
            <Button
              variant="outli
              onClick={() => adjustTime(15)}
              className="h-10 px-2.5
            >
            
     

              disabled={disabled}
    
              +30
          </div>

      {validationError && (
          <Warning className="h-4 w-4" w
        </div>
    
}

























































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
