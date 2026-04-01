const DEFAULT_APP_TIMEZONE_OFFSET = "+08:00";

const ISO_OFFSET_PATTERN = /(Z|[+-]\d{2}:\d{2})$/i;

const getAppTimezoneOffset = () =>
  process.env.APP_TIMEZONE_OFFSET?.trim() || DEFAULT_APP_TIMEZONE_OFFSET;

const normalizeNaiveDateTime = (value: string) => {
  const trimmed = value.trim();

  if (!trimmed || ISO_OFFSET_PATTERN.test(trimmed)) {
    return trimmed;
  }

  const normalized = trimmed.replace(" ", "T");
  return `${normalized}${getAppTimezoneOffset()}`;
};

export function parseAppDateTime(value: string, field: string): Date {
  const normalized = normalizeNaiveDateTime(value);
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid ${field}`);
  }

  return parsed;
}

export function normalizeAppDateTimeInput(value: string): string {
  return parseAppDateTime(value, "datetime").toISOString();
}
