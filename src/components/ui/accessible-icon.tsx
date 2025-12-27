import { forwardRef } from 'react';

interface AccessibleIconProps {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  label: string;
  className?: string;
  decorative?: boolean;
}

export const AccessibleIcon = forwardRef<HTMLSpanElement, AccessibleIconProps>(
  ({ icon: Icon, label, className, decorative = false }, ref) => {
    if (decorative) {
      return <Icon className={className} aria-hidden="true" />;
    }

    return (
      <span ref={ref} role="img" aria-label={label}>
        <Icon className={className} aria-hidden="true" />
      </span>
    );
  }
);

AccessibleIcon.displayName = 'AccessibleIcon';
