import {
  format,
  formatDistanceToNow,
  isValid,
  parseISO,
} from "date-fns";

export function formatDate(
  date: string | Date,
  pattern = "MMM d, yyyy"
): string {
  const parsedDate = typeof date === "string" ? parseISO(date) : date;

  if (!isValid(parsedDate)) {
    return "Invalid date";
  }

  return format(parsedDate, pattern);
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, "MMM d, yyyy, h:mm a");
}

export function timeAgo(date: string | Date): string {
  const parsedDate = typeof date === "string" ? parseISO(date) : date;

  if (!isValid(parsedDate)) {
    return "Invalid date";
  }

  return formatDistanceToNow(parsedDate, {
    addSuffix: true,
  });
}

export function isValidDate(date: string | Date): boolean {
  const parsedDate = typeof date === "string" ? parseISO(date) : date;

  return isValid(parsedDate);
}