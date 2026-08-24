/**
 * Formats a Date object to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns the day of the week in English (e.g., "Monday")
 */
export function getDayName(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

/**
 * Adds minutes to an HH:mm string and returns new HH:mm
 */
export function addMinutesToTime(timeStr: string, minutesToAdd: number): string {
  const [h, m] = timeStr.split(':').map(Number);
  const totalMinutes = h * 60 + m + minutesToAdd;
  const newH = Math.floor(totalMinutes / 60);
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

/**
 * Checks if time A is strictly before time B (HH:mm format)
 */
export function isTimeBefore(timeA: string, timeB: string): boolean {
  return timeA < timeB;
}

/**
 * Checks if a slot falls within a break range
 */
export function isSlotDuringBreak(
  slotStart: string,
  slotEnd: string,
  breakStart?: string | null,
  breakEnd?: string | null
): boolean {
  if (!breakStart || !breakEnd) return false;
  // Overlaps if slotStart < breakEnd and slotEnd > breakStart
  return slotStart < breakEnd && slotEnd > breakStart;
}

/**
 * Generates all discrete time slots for a doctor's working schedule
 */
export function generateDoctorSlots(
  startHour: string,
  endHour: string,
  durationMinutes: number,
  breakStart?: string | null,
  breakEnd?: string | null
): Array<{ startTime: string; endTime: string }> {
  const slots: Array<{ startTime: string; endTime: string }> = [];
  let current = startHour;

  while (isTimeBefore(current, endHour)) {
    const next = addMinutesToTime(current, durationMinutes);
    if (next > endHour) break;

    // Check if slot falls in break
    if (!isSlotDuringBreak(current, next, breakStart, breakEnd)) {
      slots.push({ startTime: current, endTime: next });
    }
    current = next;
  }

  return slots;
}

/**
 * Checks if a date string is between startDate and endDate inclusive
 */
export function isDateInRange(targetDate: string, startDate: string, endDate: string): boolean {
  return targetDate >= startDate && targetDate <= endDate;
}
