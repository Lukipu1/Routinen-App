import type { ISODateString, ISODateTimeString, TimeString, Weekday } from '../types/common';

/**
 * Date/time helpers built around **local** time. Working in the device's local
 * timezone keeps day boundaries, weekday selection and clock times correct
 * across DST changes without extra bookkeeping.
 */

/** Formats a Date as a local `yyyy-MM-dd` calendar day. */
export function toISODate(date: Date): ISODateString {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Parses a `yyyy-MM-dd` string to a Date at local midnight. */
export function parseISODate(value: ISODateString): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

/** Today's local calendar day. */
export function todayISO(now: Date = new Date()): ISODateString {
  return toISODate(now);
}

/** Full ISO timestamp for the current moment. */
export function nowISO(now: Date = new Date()): ISODateTimeString {
  return now.toISOString();
}

/** JS weekday (0 = Sunday) for a calendar day. */
export function weekdayOf(value: ISODateString): Weekday {
  return parseISODate(value).getDay() as Weekday;
}

/** Adds (or subtracts) whole days to a calendar day, staying DST-safe. */
export function addDaysISO(value: ISODateString, days: number): ISODateString {
  const date = parseISODate(value);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

/** Difference in whole days between two calendar days (a - b). */
export function differenceInDaysISO(a: ISODateString, b: ISODateString): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const da = parseISODate(a).getTime();
  const db = parseISODate(b).getTime();
  return Math.round((da - db) / msPerDay);
}

export function isSameISODate(a: ISODateString, b: ISODateString): boolean {
  return a === b;
}

export function isBeforeISODate(a: ISODateString, b: ISODateString): boolean {
  return a < b;
}

/** Converts `HH:mm` to minutes since midnight. */
export function timeToMinutes(time: TimeString): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

/** Converts minutes since midnight to `HH:mm`. */
export function minutesToTime(totalMinutes: number): TimeString {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, Math.round(totalMinutes)));
  const hours = String(Math.floor(clamped / 60)).padStart(2, '0');
  const minutes = String(clamped % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/** Combines a calendar day and `HH:mm` into a local Date (DST-safe). */
export function combineDateAndTime(dateISO: ISODateString, time: TimeString): Date {
  const date = parseISODate(dateISO);
  const [hours, minutes] = time.split(':').map(Number);
  date.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return date;
}

/** True when `time` (HH:mm) is at or before the given moment on that day. */
export function isTimePassed(dateISO: ISODateString, time: TimeString, now: Date): boolean {
  return combineDateAndTime(dateISO, time).getTime() <= now.getTime();
}
