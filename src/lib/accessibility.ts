export function checkColorContrast(foreground: string, background: string): number {
  const getLuminance = (color: string): number => {
    const rgb = color.match(/\d+(\.\d+)?/g)?.map(Number) || [0, 0, 0]
    const [r, g, b] = rgb.map(val => {
      const sRGB = val / 255
      return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  const l1 = getLuminance(foreground)
  const l2 = getLuminance(background)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  
  return (lighter + 0.05) / (darker + 0.05)
}

export function meetsWCAGAA(contrastRatio: number, isLargeText = false): boolean {
  return isLargeText ? contrastRatio >= 3 : contrastRatio >= 4.5
}

export function meetsWCAGAAA(contrastRatio: number, isLargeText = false): boolean {
  return isLargeText ? contrastRatio >= 4.5 : contrastRatio >= 7
}

export function generateAriaLabel(
  baseLabel: string,
  context?: { [key: string]: string | number | boolean | undefined }
): string {
  if (!context) return baseLabel
  
  const parts = [baseLabel]
  Object.entries(context).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      parts.push(`${key}: ${value}`)
    }
  })
  
  return parts.join(', ')
}

export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

// Keyboard Navigation Helper
export function trapFocus(element: HTMLElement) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  element.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  });
}

// Reduced Motion Check
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// High Contrast Mode Check
export function prefersHighContrast(): boolean {
  return window.matchMedia('(prefers-contrast: more)').matches;
}

// Live Region for Dynamic Updates
export function createLiveRegion(id: string): HTMLElement {
  let region = document.getElementById(id);
  if (!region) {
    region = document.createElement('div');
    region.id = id;
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only';
    document.body.appendChild(region);
  }
  return region;
}

// Announce State Changes
export function announceStateChange(message: string) {
  const region = createLiveRegion('state-announcer');
  region.textContent = message;
}

export const focusRingClasses = 'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background'

export const skipLinkClasses = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md'
