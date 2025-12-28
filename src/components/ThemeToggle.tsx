import { Sun, Moon, Monitor } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from '@/hooks/use-theme'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Theme wechseln"
          className="h-9 w-9 min-h-[2.25rem] min-w-[2.25rem] relative"
        >
          <Sun className="h-5 w-5 shrink-0 rotate-0 scale-100 transition-transform dark:rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 shrink-0 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Theme wechseln</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className="gap-2 min-h-[36px]"
        >
          <Sun className="h-4 w-4 shrink-0" />
          <span className="flex-1">Hell</span>
          {theme === 'light' && (
            <span className="ml-auto text-xs text-muted-foreground shrink-0">✓</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className="gap-2 min-h-[36px]"
        >
          <Moon className="h-4 w-4 shrink-0" />
          <span className="flex-1">Dunkel</span>
          {theme === 'dark' && (
            <span className="ml-auto text-xs text-muted-foreground shrink-0">✓</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className="gap-2 min-h-[36px]"
        >
          <Monitor className="h-4 w-4 shrink-0" />
          <span className="flex-1">System</span>
          {(!theme || theme === 'system') && (
            <span className="ml-auto text-xs text-muted-foreground shrink-0">✓</span>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
