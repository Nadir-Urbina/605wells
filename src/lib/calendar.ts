import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

const EST_TIMEZONE = 'America/New_York';

/**
 * Format a date in EST timezone
 */
export function formatDateEST(date: Date | string, formatStr: string = 'yyyy-MM-dd'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(dateObj, EST_TIMEZONE, formatStr);
}

/**
 * Get current date/time in EST
 */
export function nowEST(): Date {
  return toZonedTime(new Date(), EST_TIMEZONE);
}

/**
 * Generate time slots for a given duration
 * @param duration - Duration in minutes
 * @returns Array of time slot strings
 */
export function generateTimeSlots(duration: number): string[] {
  const slots: string[] = [];
  const startHour = 9; // 9 AM
  const endHour = 17; // 5 PM

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += duration) {
      const timeStr = formatTime(hour, minute);
      slots.push(timeStr);
    }
  }

  return slots;
}

/**
 * Format hour and minute to time string
 */
export function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
}

/**
 * Get next 7 days starting from today
 */
export function getNextWeek(): Date[] {
  const today = nowEST();
  const days: Date[] = [];

  for (let i = 0; i < 7; i++) {
    days.push(addDays(today, i));
  }

  return days;
}

/**
 * Get week containing a specific date
 */
export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 0 }); // Sunday
  const end = endOfWeek(date, { weekStartsOn: 0 });

  const days: Date[] = [];
  let currentDay = start;

  while (currentDay <= end) {
    days.push(currentDay);
    currentDay = addDays(currentDay, 1);
  }

  return days;
}

/**
 * Check if a date is in the past (EST)
 */
export function isPastDate(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const now = nowEST();
  return dateObj < now;
}

/**
 * Parse time string to hour and minute
 * @param timeStr - Time string like "10:00 AM"
 */
export function parseTimeString(timeStr: string): { hour: number; minute: number } {
  const [time, period] = timeStr.split(' ');
  const [hourStr, minuteStr] = time.split(':');
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  if (period === 'PM' && hour !== 12) {
    hour += 12;
  } else if (period === 'AM' && hour === 12) {
    hour = 0;
  }

  return { hour, minute };
}

/**
 * Create a Date object from date string and time string (EST)
 */
export function createDateTimeEST(dateStr: string, timeStr: string): Date {
  const { hour, minute } = parseTimeString(timeStr);
  const dateObj = parseISO(dateStr);

  dateObj.setHours(hour, minute, 0, 0);

  return toZonedTime(dateObj, EST_TIMEZONE);
}

/**
 * Format date for display (e.g., "Monday, Mar 5")
 */
export function formatDisplayDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(dateObj, EST_TIMEZONE, 'EEEE, MMM d');
}

/**
 * Get day of week (e.g., "Monday", "Tuesday")
 */
export function getDayOfWeek(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(dateObj, EST_TIMEZONE, 'EEEE');
}
