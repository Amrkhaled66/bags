export function parsePositiveIntParam(
  value: string | null,
  fallback: number,
) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function parseBooleanParam(value: string | null) {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export function parseEnumParam<T extends string>(
  value: string | null,
  values: readonly T[],
): T | undefined {
  return values.includes(value as T) ? (value as T) : undefined;
}

export function optionalParam(value: string | null) {
  return value ?? undefined;
}

export function writeSearchParam(
  params: URLSearchParams,
  key: string,
  value: boolean | number | string | null | undefined,
  defaultValue?: boolean | number | string,
) {
  if (value === undefined || value === null || value === "" || value === defaultValue) {
    return;
  }
  params.set(key, String(value));
}
