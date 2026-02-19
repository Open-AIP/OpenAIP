function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function formatYmd(date: Date): string {
  const year = date.getUTCFullYear();
  const month = pad2(date.getUTCMonth() + 1);
  const day = pad2(date.getUTCDate());
  return `${year}-${month}-${day}`;
}

function getDatePartsInTimeZone(timeZone: string): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  return { year, month, day };
}

export function getTodayInTimeZoneYmd(timeZone: string): string {
  const { year, month, day } = getDatePartsInTimeZone(timeZone);
  const date = new Date(Date.UTC(year, month - 1, day));
  return formatYmd(date);
}

export function getDateDaysAgoInTimeZoneYmd(timeZone: string, daysAgo: number): string {
  const { year, month, day } = getDatePartsInTimeZone(timeZone);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return formatYmd(date);
}
