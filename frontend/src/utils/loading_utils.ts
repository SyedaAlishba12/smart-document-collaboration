export function isLoading(value: boolean): boolean {
  return value === true;
}

export function isLoaded(value: boolean): boolean {
  return value === false;
}

export function getLoadingMessage(
  action = "Loading"
): string {
  return `${action}...`;
}