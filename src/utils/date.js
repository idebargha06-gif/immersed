export function toIsoDayKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toLegacyDayString(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toDateString();
}

export function normalizeDayValue(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return toIsoDayKey(parsed);
}

export function normalizeDayCollection(values = []) {
  return [...new Set(values.map(normalizeDayValue).filter(Boolean))].sort();
}

export function getRelativeIsoDay(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return toIsoDayKey(date);
}

export function getTodayIsoDay() {
  return toIsoDayKey(new Date());
}

export function formatSessionDateLabel(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export function getLastTwentyEightDays() {
  const days = [];

  for (let offset = 27; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    days.push({
      iso: toIsoDayKey(date),
      label: date.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2),
      dayNumber: date.getDate()
    });
  }

  return days;
}

export function getMonthKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function parseMonthKey(monthKey) {
  if (!/^\d{4}-\d{2}$/.test(monthKey)) {
    const today = new Date();
    return {
      year: today.getFullYear(),
      month: today.getMonth()
    };
  }

  const [year, month] = monthKey.split("-").map(Number);
  return {
    year,
    month: month - 1
  };
}

export function shiftMonthKey(monthKey, delta) {
  const { year, month } = parseMonthKey(monthKey);
  const date = new Date(year, month + delta, 1);
  return getMonthKey(date);
}

export function formatMonthLabel(monthKey, locale) {
  const { year, month } = parseMonthKey(monthKey);
  return new Date(year, month, 1).toLocaleDateString(locale, {
    month: "long",
    year: "numeric"
  });
}

export function getMonthGrid(monthKey, locale) {
  const { year, month } = parseMonthKey(monthKey);
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingEmpty = firstDay.getDay();
  const cells = [];

  for (let index = 0; index < leadingEmpty; index += 1) {
    cells.push({ type: "empty", id: `empty-${monthKey}-${index}` });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const value = new Date(year, month, day);
    cells.push({
      type: "day",
      date: value,
      iso: toIsoDayKey(value),
      dayNumber: day,
      weekdayLabel: value.toLocaleDateString(locale, { weekday: "short" })
    });
  }

  return cells;
}
