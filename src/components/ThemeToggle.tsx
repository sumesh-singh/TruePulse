
import React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const ThemeToggle: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  // Handler for toggle
  const handleToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      className="flex items-center p-1.5 rounded-md hover:bg-muted transition-colors gap-2 border border-input"
      aria-label="Toggle dark and light mode"
      onClick={handleToggle}
      type="button"
    >
      <Switch checked={isDark} onCheckedChange={handleToggle} />
      {isDark ? (
        <Moon className="h-5 w-5 text-blue-700" />
      ) : (
        <Sun className="h-5 w-5 text-yellow-400" />
      )}
      <span className="text-xs text-gray-700 dark:text-gray-200 font-medium ml-1">{isDark ? "Dark" : "Light"} Mode</span>
    </button>
  );
};

export default ThemeToggle;
