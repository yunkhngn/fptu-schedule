import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { getNextTheme, getThemeLabel, type ThemePreference } from "@/theme/theme";

export interface ThemeToggleProps {
  preference: ThemePreference;
  onChange: (next: ThemePreference) => void;
  className?: string;
}

export function ThemeToggle({
  preference,
  onChange,
  className,
}: ThemeToggleProps) {
  const Icon = preference === "light" ? Sun : preference === "dark" ? Moon : Monitor;

  return (
    <Button
      variant="outline"
      size="icon"
      className={className}
      aria-label={getThemeLabel(preference)}
      onClick={() => onChange(getNextTheme(preference))}
    >
      <Icon className="size-4" strokeWidth={1.75} />
    </Button>
  );
}
