// In-person seating for hybrid events. The event's registrationLimit is the
// room capacity; online attendance is unlimited.
//
// Registrations with no attendanceType were made while an event was still
// in-person only (before it was switched to hybrid), so they hold a seat too.

/** GROQ filter for registrations that hold an in-person seat */
export const IN_PERSON_SEAT_FILTER =
  'status != "cancelled" && (attendanceType == "in-person" || !defined(attendanceType))';

export function isInPersonRegistration(registration: { attendanceType?: string }) {
  return registration.attendanceType !== 'online';
}

export function getInPersonAvailability(event: {
  registrationLimit?: number;
  inPersonRegistrationClosed?: boolean;
  inPersonRegistrationCount?: number;
}) {
  const taken = event.inPersonRegistrationCount ?? 0;
  const limit = event.registrationLimit || null;
  const remaining = limit === null ? null : Math.max(0, limit - taken);
  const isFull = !!event.inPersonRegistrationClosed || remaining === 0;

  return { taken, limit, remaining, isFull };
}
