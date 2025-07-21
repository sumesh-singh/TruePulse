import React from "react";
import { useTheme } from "@/components/ThemeProvider"; // Corrected import path
import { Switch } from "@/components/ui/switch";
import { Moon, Sun } from "lucide-react";

export const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();

  // Determine the current visual theme, resolving "system"
  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Don't render on the server or until mounted on the client
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="flex items-center gap-2">
      <Sun className="w-4 h-4 text-yellow-400" />
      <Switch
        checked={isDark}
        onCheckedChange={() => setTheme(isDark ? "light" : "dark")}
        aria-label="Toggle theme"
      />
      <Moon className="w-4 h-4 text-blue-700" />
    </div>
  );
};
