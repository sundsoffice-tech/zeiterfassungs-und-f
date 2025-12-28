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

export const focusRingClasses = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-shadow duration-200'

export const skipLinkClasses = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg'

export const visuallyHiddenClasses = 'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0'

export function getLandmarkRole(section: 'header' | 'main' | 'nav' | 'footer' | 'aside' | 'region'): string {
  const roles = {
    header: 'banner',
    main: 'main',
    nav: 'navigation',
    footer: 'contentinfo',
    aside: 'complementary',
    region: 'region'
  }
  return roles[section]
}

export function formatTimeForScreenReader(hours: number, minutes: number): string {
  const hourText = hours === 1 ? '1 Stunde' : `${hours} Stunden`
  const minuteText = minutes === 1 ? '1 Minute' : `${minutes} Minuten`
  
  if (hours === 0) return minuteText
  if (minutes === 0) return hourText
  return `${hourText} und ${minuteText}`
}

export function formatDateForScreenReader(date: Date): string {
  const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
  const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
  
  const dayName = days[date.getDay()]
  const day = date.getDate()
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  
  return `${dayName}, ${day}. ${month} ${year}`
}
