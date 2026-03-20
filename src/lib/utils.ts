export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const hours = diff / (1000 * 60 * 60);

  if (hours < 1) {
    const mins = Math.floor(diff / (1000 * 60));
    return mins <= 0 ? "just now" : `${mins}m ago`;
  }
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  if (hours < 48) return "yesterday";

  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function generateTitle(): string {
  const now = new Date();
  return `Note — ${now.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  })} at ${now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}
