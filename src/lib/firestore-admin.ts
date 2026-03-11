import { adminFirestore } from './firebase-admin';
import type { Timestamp } from 'firebase-admin/firestore';

// TypeScript Interfaces (reused from client firestore.ts)
export interface TeamMemberAuth {
  id: string;
  sanityTeamMemberId: string;
  email: string;
  role: 'team-member';
  createdAt: Timestamp;
  lastLogin?: Timestamp;
}

export interface Booking {
  id: string;
  ministryType: string;
  ministryTypeTitle: string;
  teamMemberId: string;
  teamMemberName: string;
  userId?: string;
  attendeeInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  attendanceType: 'paid' | 'free';
  payment?: {
    stripePaymentIntentId: string;
    amount: number;
    status: 'completed' | 'pending' | 'refunded';
  };
  videoMeeting?: {
    provider: 'daily' | 'zoom';
    roomId: string;
    roomName: string;
    joinUrl: string;
    createdAt: string;
    expiresAt: string | null;
    // Recording information
    recordingEnabled: boolean;
    recordingUrl?: string;
    recordingDownloadUrl?: string;
    recordingStatus?: 'recording' | 'finished' | 'available' | 'failed';
    recordingDuration?: number; // seconds
    // Legacy Zoom fields (for backward compatibility)
    meetingId?: string;
    startUrl?: string;
    password?: string;
  };
  intakeForm?: {
    submittedAt: string;
    responses: Record<string, unknown>;
  };
  rescheduleHistory: Array<{
    from: { date: string; time: string };
    to: { date: string; time: string };
    requestedAt: string;
    requestedBy: 'user' | 'team-member' | 'admin';
    reason?: string;
  }>;
  rescheduleCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface QueueEntry {
  id: string;
  ministryType: string;
  ministryTypeTitle: string;
  attendeeInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  preferredDays?: string[];
  preferredTimes?: string[];
  requestMessage?: string;
  status: 'pending' | 'assigned' | 'completed' | 'cancelled';
  priority: number;
  assignedBookingId?: string;
  intakeForm?: {
    submittedAt: string;
    responses: Record<string, unknown>;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  bookingId?: string;
}

export interface AvailabilitySlot {
  id: string;
  teamMemberId: string;
  date: string;
  timeSlots: TimeSlot[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Collection References
export const COLLECTIONS = {
  BOOKINGS: 'bookings',
  QUEUE_ENTRIES: 'queueEntries',
  AVAILABILITY: 'availability',
  TEAM_MEMBER_AUTH: 'teamMemberAuth',
} as const;

/**
 * SERVER-SIDE: Create or update team member auth mapping
 * Uses Admin SDK to bypass security rules
 */
export async function setTeamMemberAuth(
  firebaseUid: string,
  sanityTeamMemberId: string,
  email: string
): Promise<void> {
  const authRef = adminFirestore.collection(COLLECTIONS.TEAM_MEMBER_AUTH).doc(firebaseUid);
  await authRef.set({
    id: firebaseUid,
    sanityTeamMemberId,
    email,
    role: 'team-member' as const,
    createdAt: new Date(),
  });
}

/**
 * SERVER-SIDE: Get team member auth data
 */
export async function getTeamMemberAuth(
  firebaseUid: string
): Promise<TeamMemberAuth | null> {
  const authRef = adminFirestore.collection(COLLECTIONS.TEAM_MEMBER_AUTH).doc(firebaseUid);
  const authSnap = await authRef.get();

  if (!authSnap.exists) {
    return null;
  }

  return authSnap.data() as TeamMemberAuth;
}

/**
 * SERVER-SIDE: Update last login timestamp
 */
export async function updateLastLogin(firebaseUid: string): Promise<void> {
  const authRef = adminFirestore.collection(COLLECTIONS.TEAM_MEMBER_AUTH).doc(firebaseUid);
  await authRef.update({
    lastLogin: new Date(),
  });
}

/**
 * SERVER-SIDE: Create a new booking in Firestore
 */
export async function createBooking(
  bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const bookingsRef = adminFirestore.collection(COLLECTIONS.BOOKINGS);
  const newBookingRef = bookingsRef.doc();

  const booking = {
    ...bookingData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await newBookingRef.set(booking);
  return newBookingRef.id;
}

/**
 * SERVER-SIDE: Get a booking by ID
 */
export async function getBooking(bookingId: string): Promise<Booking | null> {
  const bookingRef = adminFirestore.collection(COLLECTIONS.BOOKINGS).doc(bookingId);
  const bookingSnap = await bookingRef.get();

  if (!bookingSnap.exists) {
    return null;
  }

  return {
    id: bookingSnap.id,
    ...bookingSnap.data(),
  } as Booking;
}

/**
 * SERVER-SIDE: Get a booking by payment intent ID
 */
export async function getBookingByPaymentIntent(paymentIntentId: string): Promise<Booking | null> {
  const bookingsRef = adminFirestore.collection(COLLECTIONS.BOOKINGS);
  const snapshot = await bookingsRef
    .where('payment.stripePaymentIntentId', '==', paymentIntentId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  } as Booking;
}

/**
 * SERVER-SIDE: Get a booking by Daily.co room name
 */
export async function getBookingByRoomName(roomName: string): Promise<Booking | null> {
  const bookingsRef = adminFirestore.collection(COLLECTIONS.BOOKINGS);
  const snapshot = await bookingsRef
    .where('videoMeeting.roomName', '==', roomName)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  } as Booking;
}

/**
 * SERVER-SIDE: Update a booking
 * Supports nested field updates using dot notation (e.g., 'videoMeeting.recordingUrl')
 */
export async function updateBooking(
  bookingId: string,
  updates: Partial<Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>> | Record<string, unknown>
): Promise<void> {
  const bookingRef = adminFirestore.collection(COLLECTIONS.BOOKINGS).doc(bookingId);
  await bookingRef.update({
    ...updates,
    updatedAt: new Date(),
  });
}

/**
 * SERVER-SIDE: Get all bookings (admin)
 */
export async function getAllBookings(): Promise<Booking[]> {
  const bookingsRef = adminFirestore.collection(COLLECTIONS.BOOKINGS);
  const snapshot = await bookingsRef.orderBy('scheduledDate', 'desc').get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Booking[];
}

/**
 * SERVER-SIDE: Get a single queue entry by ID
 */
export async function getQueueEntry(queueId: string): Promise<QueueEntry | null> {
  const queueRef = adminFirestore.collection(COLLECTIONS.QUEUE_ENTRIES).doc(queueId);
  const queueSnap = await queueRef.get();

  if (!queueSnap.exists) {
    return null;
  }

  return {
    id: queueSnap.id,
    ...queueSnap.data(),
  } as QueueEntry;
}

/**
 * SERVER-SIDE: Create a queue entry
 */
export async function createQueueEntry(
  queueData: Omit<QueueEntry, 'id' | 'createdAt' | 'updatedAt' | 'priority'>
): Promise<string> {
  const queueRef = adminFirestore.collection(COLLECTIONS.QUEUE_ENTRIES);
  const newQueueRef = queueRef.doc();

  const entry = {
    ...queueData,
    priority: Date.now(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await newQueueRef.set(entry);
  return newQueueRef.id;
}

/**
 * SERVER-SIDE: Get queue entries with optional status filter
 */
export async function getQueueEntries(
  statusFilter: QueueEntry['status'][] = ['pending']
): Promise<QueueEntry[]> {
  const queueRef = adminFirestore.collection(COLLECTIONS.QUEUE_ENTRIES);
  const query = queueRef.where('status', 'in', statusFilter);

  const snapshot = await query.orderBy('priority', 'desc').orderBy('createdAt', 'asc').get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as QueueEntry[];
}

/**
 * SERVER-SIDE: Update queue entry status
 */
export async function updateQueueEntry(
  queueId: string,
  updates: Partial<Omit<QueueEntry, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const queueRef = adminFirestore.collection(COLLECTIONS.QUEUE_ENTRIES).doc(queueId);
  await queueRef.update({
    ...updates,
    updatedAt: new Date(),
  });
}

/**
 * SERVER-SIDE: Book a time slot (with transaction to prevent double-booking)
 */
export async function bookTimeSlot(
  teamMemberId: string,
  date: string,
  startTime: string,
  bookingId: string
): Promise<void> {
  const availabilityRef = adminFirestore.collection(COLLECTIONS.AVAILABILITY);
  const snapshot = await availabilityRef
    .where('teamMemberId', '==', teamMemberId)
    .where('date', '==', date)
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new Error('No availability found for this date');
  }

  const availabilityDoc = snapshot.docs[0];
  const availabilityData = availabilityDoc.data() as AvailabilitySlot;

  // Find the specific time slot
  const slotIndex = availabilityData.timeSlots.findIndex(
    (slot) => slot.startTime === startTime
  );

  if (slotIndex === -1) {
    throw new Error('Time slot not found');
  }

  const slot = availabilityData.timeSlots[slotIndex];

  // Check if slot is available
  if (!slot.available || slot.bookingId) {
    throw new Error('Time slot is not available');
  }

  // Update the slot
  const updatedSlots = [...availabilityData.timeSlots];
  updatedSlots[slotIndex] = {
    ...slot,
    available: false,
    bookingId,
  };

  // Update in Firestore
  await availabilityDoc.ref.update({
    timeSlots: updatedSlots,
    updatedAt: new Date(),
  });
}

/**
 * SERVER-SIDE: Get bookings for a specific team member
 */
export async function getBookingsByTeamMember(
  teamMemberId: string
): Promise<Booking[]> {
  const bookingsRef = adminFirestore.collection(COLLECTIONS.BOOKINGS);
  const snapshot = await bookingsRef
    .where('teamMemberId', '==', teamMemberId)
    .orderBy('scheduledDate', 'desc')
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Booking[];
}

/**
 * SERVER-SIDE: Get availability slots for a team member and date range
 */
export async function getAvailability(
  teamMemberId: string,
  startDate: string,
  endDate: string
): Promise<AvailabilitySlot[]> {
  const availabilityRef = adminFirestore.collection(COLLECTIONS.AVAILABILITY);
  const snapshot = await availabilityRef
    .where('teamMemberId', '==', teamMemberId)
    .where('date', '>=', startDate)
    .where('date', '<=', endDate)
    .orderBy('date', 'asc')
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as AvailabilitySlot[];
}

/**
 * SERVER-SIDE: Set availability for a team member on a specific date
 */
export async function setAvailability(
  teamMemberId: string,
  date: string,
  timeSlots: TimeSlot[]
): Promise<void> {
  const availabilityRef = adminFirestore.collection(COLLECTIONS.AVAILABILITY);

  // Check if availability exists for this date
  const snapshot = await availabilityRef
    .where('teamMemberId', '==', teamMemberId)
    .where('date', '==', date)
    .limit(1)
    .get();

  if (snapshot.empty) {
    // Create new availability
    const newAvailabilityRef = availabilityRef.doc();
    await newAvailabilityRef.set({
      teamMemberId,
      date,
      timeSlots,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } else {
    // Update existing availability
    const existingDoc = snapshot.docs[0];
    await existingDoc.ref.update({
      timeSlots,
      updatedAt: new Date(),
    });
  }
}
