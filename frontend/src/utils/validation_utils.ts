export function isRequired(value: string): boolean {
  return value.trim().length > 0;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function minLength(value: string, length: number): boolean {
  return value.trim().length >= length;
}

export function maxLength(value: string, length: number): boolean {
  return value.trim().length <= length;
}