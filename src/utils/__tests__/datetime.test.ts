import {
  addDaysISO,
  combineDateAndTime,
  differenceInDaysISO,
  isTimePassed,
  minutesToTime,
  parseISODate,
  timeToMinutes,
  toISODate,
  weekdayOf,
} from '../datetime';

describe('datetime helpers', () => {
  it('round-trips calendar days regardless of timezone', () => {
    const iso = '2026-07-22';
    expect(toISODate(parseISODate(iso))).toBe(iso);
  });

  it('adds days across month boundaries', () => {
    expect(addDaysISO('2026-02-28', 1)).toBe('2026-03-01');
    expect(addDaysISO('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('stays correct across a DST spring-forward boundary', () => {
    // Central European DST starts 2026-03-29; day arithmetic must not drift.
    expect(addDaysISO('2026-03-28', 2)).toBe('2026-03-30');
    expect(differenceInDaysISO('2026-03-30', '2026-03-28')).toBe(2);
  });

  it('computes the weekday (0 = Sunday)', () => {
    // 2026-01-04 is a Sunday.
    expect(weekdayOf('2026-01-04')).toBe(0);
    // 2026-01-05 is a Monday.
    expect(weekdayOf('2026-01-05')).toBe(1);
  });

  it('converts between HH:mm and minutes', () => {
    expect(timeToMinutes('07:30')).toBe(450);
    expect(minutesToTime(450)).toBe('07:30');
    expect(minutesToTime(0)).toBe('00:00');
  });

  it('combines a day and time into a local Date', () => {
    const date = combineDateAndTime('2026-07-22', '08:15');
    expect(date.getHours()).toBe(8);
    expect(date.getMinutes()).toBe(15);
  });

  it('detects a passed time', () => {
    const now = new Date(2026, 6, 22, 9, 0, 0);
    expect(isTimePassed('2026-07-22', '07:00', now)).toBe(true);
    expect(isTimePassed('2026-07-22', '10:00', now)).toBe(false);
  });
});
