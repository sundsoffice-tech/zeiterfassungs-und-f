import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check, X, Pencil } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface InlineEditableCellProps {
  value: string | number
  onSave: (value: string | number) => void
  type?: 'text' | 'number'
  className?: string
  placeholder?: string
  readOnly?: boolean
}

export function InlineEditableCell({
  value,
  onSave,
  type = 'text',
  className,
  placeholder,
  readOnly = false
}: InlineEditableCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    setEditValue(value)
  }, [value])

  const handleSave = () => {
    if (type === 'number') {
      const numValue = parseFloat(editValue.toString())
      if (!isNaN(numValue)) {
        onSave(numValue)
      }
    } else {
      onSave(editValue)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  if (readOnly || !isEditing) {
    return (
      <div
        className={cn(
          'group relative flex items-center gap-2 py-2 px-3 rounded-md cursor-pointer hover:bg-accent/50 transition-colors',
          className
        )}
        onClick={() => !readOnly && setIsEditing(true)}
      >
        <span className="flex-1">
          {value || <span className="text-muted-foreground italic">{placeholder || 'Leer'}</span>}
        </span>
        {!readOnly && (
          <Pencil
            className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            weight="bold"
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        ref={inputRef}
        type={type}
        value={editValue}
        onChange={(e) => setEditValue(type === 'number' ? e.target.value : e.target.value)}
        onKeyDown={handleKeyDown}
        className="h-8"
        placeholder={placeholder}
      />
      <Button
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
        onClick={handleSave}
      >
        <Check className="h-4 w-4" weight="bold" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={handleCancel}
      >
        <X className="h-4 w-4" weight="bold" />
      </Button>
    </div>
  )
}
