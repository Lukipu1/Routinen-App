import { makeRoutine } from '../../../testing/factories';
import { isRoutineScheduledOn, nextOccurrence, occurrencesInRange } from '../recurrence';

// 2026-01-05 is a Monday, 2026-01-06 a Tuesday.
const MONDAY = '2026-01-05';
const TUESDAY = '2026-01-06';
const NEXT_MONDAY = '2026-01-12';

describe('recurrence', () => {
  describe('isRoutineScheduledOn', () => {
    it('matches selected weekdays', () => {
      const routine = makeRoutine({ schedule: { weekdays: [1] } });
      expect(isRoutineScheduledOn(routine, MONDAY)).toBe(true);
      expect(isRoutineScheduledOn(routine, TUESDAY)).toBe(false);
    });

    it('respects the start date', () => {
      const routine = makeRoutine({ schedule: { weekdays: [1], startDate: '2026-01-10' } });
      expect(isRoutineScheduledOn(routine, MONDAY)).toBe(false);
      expect(isRoutineScheduledOn(routine, NEXT_MONDAY)).toBe(true);
    });

    it('respects the end date', () => {
      const routine = makeRoutine({ schedule: { weekdays: [1], endDate: MONDAY } });
      expect(isRoutineScheduledOn(routine, MONDAY)).toBe(true);
      expect(isRoutineScheduledOn(routine, NEXT_MONDAY)).toBe(false);
    });

    it('returns false when the schedule is disabled or has no weekdays', () => {
      expect(isRoutineScheduledOn(makeRoutine({ schedule: { enabled: false, weekdays: [1] } }), MONDAY)).toBe(false);
      expect(isRoutineScheduledOn(makeRoutine({ schedule: { weekdays: [] } }), MONDAY)).toBe(false);
    });
  });

  describe('nextOccurrence', () => {
    it('finds the next matching day inclusive of the start', () => {
      const routine = makeRoutine({ schedule: { weekdays: [1] } });
      expect(nextOccurrence(routine, MONDAY)).toBe(MONDAY);
      expect(nextOccurrence(routine, TUESDAY)).toBe(NEXT_MONDAY);
    });

    it('returns null within the horizon when never scheduled', () => {
      const routine = makeRoutine({ schedule: { weekdays: [] } });
      expect(nextOccurrence(routine, MONDAY, 30)).toBeNull();
    });
  });

  describe('occurrencesInRange', () => {
    it('lists all matching days in an inclusive range', () => {
      const routine = makeRoutine({ schedule: { weekdays: [1, 3] } });
      const days = occurrencesInRange(routine, MONDAY, '2026-01-14');
      // Mon 05, Wed 07, Mon 12, Wed 14
      expect(days).toEqual(['2026-01-05', '2026-01-07', '2026-01-12', '2026-01-14']);
    });
  });
});
