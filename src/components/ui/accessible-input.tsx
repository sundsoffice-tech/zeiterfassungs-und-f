import { forwardRef, useId } from 'react';
import { Input } from './input';
import { Label } from './label';
import { cn } from '@/lib/utils';

interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({ label, error, hint, required, className, id: providedId, ...props }, ref) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;

    return (
      <div className="space-y-2">
        <Label 
          htmlFor={id}
          className={cn(error && 'text-destructive')}
        >
          {label}
          {required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
          {required && <span className="sr-only">(Pflichtfeld)</span>}
        </Label>
        
        {hint && (
          <p id={hintId} className="text-sm text-muted-foreground">
            {hint}
          </p>
        )}
        
        <Input
          ref={ref}
          id={id}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={cn(hint && hintId, error && errorId)}
          className={cn(
            error && 'border-destructive focus:ring-destructive',
            className
          )}
          {...props}
        />
        
        {error && (
          <p id={errorId} className="text-sm text-destructive flex items-center gap-1" role="alert">
            <span aria-hidden="true">⚠</span>
            {error}
          </p>
        )}
      </div>
    );
  }
);

AccessibleInput.displayName = 'AccessibleInput';
