import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  runTransaction,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore';
import { firestore } from './firebase';

// TypeScript Interfaces for Firestore Collections

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

export interface TeamMemberAuth {
  id: string;
  sanityTeamMemberId: string;
  email: string;
  role: 'team-member';
  createdAt: Timestamp;
  lastLogin?: Timestamp;
}

// Collection References
export const COLLECTIONS = {
  BOOKINGS: 'bookings',
  QUEUE_ENTRIES: 'queueEntries',
  AVAILABILITY: 'availability',
  TEAM_MEMBER_AUTH: 'teamMemberAuth',
} as const;

// Helper Functions

/**
 * Create a new booking in Firestore
 */
export async function createBooking(
  bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const bookingsRef = collection(firestore, COLLECTIONS.BOOKINGS);
  const newBookingRef = doc(bookingsRef);

  const booking: Omit<Booking, 'id'> = {
    ...bookingData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  await setDoc(newBookingRef, booking);
  return newBookingRef.id;
}

/**
 * Get a booking by ID
 */
export async function getBooking(bookingId: string): Promise<Booking | null> {
  const bookingRef = doc(firestore, COLLECTIONS.BOOKINGS, bookingId);
  const bookingSnap = await getDoc(bookingRef);

  if (!bookingSnap.exists()) {
    return null;
  }

  return {
    id: bookingSnap.id,
    ...bookingSnap.data(),
  } as Booking;
}

/**
 * Update a booking
 */
export async function updateBooking(
  bookingId: string,
  updates: Partial<Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const bookingRef = doc(firestore, COLLECTIONS.BOOKINGS, bookingId);
  await updateDoc(bookingRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Get bookings for a team member
 */
export async function getTeamMemberBookings(
  teamMemberId: string,
  statusFilter?: Booking['status'][]
): Promise<Booking[]> {
  const bookingsRef = collection(firestore, COLLECTIONS.BOOKINGS);
  const constraints: QueryConstraint[] = [
    where('teamMemberId', '==', teamMemberId),
    orderBy('scheduledDate', 'asc'),
  ];

  if (statusFilter && statusFilter.length > 0) {
    constraints.push(where('status', 'in', statusFilter));
  }

  const q = query(bookingsRef, ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Booking[];
}

/**
 * Create a queue entry
 */
export async function createQueueEntry(
  queueData: Omit<QueueEntry, 'id' | 'createdAt' | 'updatedAt' | 'priority'>
): Promise<string> {
  const queueRef = collection(firestore, COLLECTIONS.QUEUE_ENTRIES);
  const newQueueRef = doc(queueRef);

  const entry: Omit<QueueEntry, 'id'> = {
    ...queueData,
    priority: Date.now(),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  await setDoc(newQueueRef, entry);
  return newQueueRef.id;
}

/**
 * Get a single queue entry by ID
 */
export async function getQueueEntry(queueId: string): Promise<QueueEntry | null> {
  const queueRef = doc(firestore, COLLECTIONS.QUEUE_ENTRIES, queueId);
  const queueSnap = await getDoc(queueRef);

  if (!queueSnap.exists()) {
    return null;
  }

  return {
    id: queueSnap.id,
    ...queueSnap.data(),
  } as QueueEntry;
}

/**
 * Get queue entries with optional status filter
 */
export async function getQueueEntries(
  statusFilter: QueueEntry['status'][] = ['pending']
): Promise<QueueEntry[]> {
  const queueRef = collection(firestore, COLLECTIONS.QUEUE_ENTRIES);
  const q = query(
    queueRef,
    where('status', 'in', statusFilter),
    orderBy('priority', 'desc'),
    orderBy('createdAt', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as QueueEntry[];
}

/**
 * Update queue entry status
 */
export async function updateQueueEntry(
  queueId: string,
  updates: Partial<Omit<QueueEntry, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const queueRef = doc(firestore, COLLECTIONS.QUEUE_ENTRIES, queueId);
  await updateDoc(queueRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Get availability slots for a team member and date range
 */
export async function getAvailability(
  teamMemberId: string,
  startDate: string,
  endDate: string
): Promise<AvailabilitySlot[]> {
  const availabilityRef = collection(firestore, COLLECTIONS.AVAILABILITY);
  const q = query(
    availabilityRef,
    where('teamMemberId', '==', teamMemberId),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as AvailabilitySlot[];
}

/**
 * Set availability for a team member on a specific date
 */
export async function setAvailability(
  teamMemberId: string,
  date: string,
  timeSlots: TimeSlot[]
): Promise<void> {
  const availabilityRef = collection(firestore, COLLECTIONS.AVAILABILITY);

  // Check if availability exists for this date
  const q = query(
    availabilityRef,
    where('teamMemberId', '==', teamMemberId),
    where('date', '==', date),
    limit(1)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    // Create new availability
    const newAvailabilityRef = doc(availabilityRef);
    await setDoc(newAvailabilityRef, {
      teamMemberId,
      date,
      timeSlots,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } else {
    // Update existing availability
    const existingDoc = snapshot.docs[0];
    await updateDoc(existingDoc.ref, {
      timeSlots,
      updatedAt: Timestamp.now(),
    });
  }
}

/**
 * Book a time slot (with transaction to prevent double-booking)
 */
export async function bookTimeSlot(
  teamMemberId: string,
  date: string,
  startTime: string,
  bookingId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await runTransaction(firestore, async (transaction) => {
      // Find availability document
      const availabilityRef = collection(firestore, COLLECTIONS.AVAILABILITY);
      const q = query(
        availabilityRef,
        where('teamMemberId', '==', teamMemberId),
        where('date', '==', date),
        limit(1)
      );

      const snapshot = await getDocs(q);

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

      // Update in transaction
      transaction.update(availabilityDoc.ref, {
        timeSlots: updatedSlots,
        updatedAt: Timestamp.now(),
      });

      return { success: true };
    });

    return result;
  } catch (error) {
    console.error('Error booking time slot:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Release a booked time slot (for cancellations)
 */
export async function releaseTimeSlot(
  teamMemberId: string,
  date: string,
  startTime: string
): Promise<void> {
  const availabilityRef = collection(firestore, COLLECTIONS.AVAILABILITY);
  const q = query(
    availabilityRef,
    where('teamMemberId', '==', teamMemberId),
    where('date', '==', date),
    limit(1)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    throw new Error('No availability found for this date');
  }

  const availabilityDoc = snapshot.docs[0];
  const availabilityData = availabilityDoc.data() as AvailabilitySlot;

  const updatedSlots = availabilityData.timeSlots.map((slot) =>
    slot.startTime === startTime
      ? { ...slot, available: true, bookingId: undefined }
      : slot
  );

  await updateDoc(availabilityDoc.ref, {
    timeSlots: updatedSlots,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Create or update team member auth mapping
 */
export async function setTeamMemberAuth(
  firebaseUid: string,
  sanityTeamMemberId: string,
  email: string
): Promise<void> {
  const authRef = doc(firestore, COLLECTIONS.TEAM_MEMBER_AUTH, firebaseUid);
  await setDoc(authRef, {
    id: firebaseUid,
    sanityTeamMemberId,
    email,
    role: 'team-member' as const,
    createdAt: Timestamp.now(),
  });
}

/**
 * Get team member auth data
 */
export async function getTeamMemberAuth(
  firebaseUid: string
): Promise<TeamMemberAuth | null> {
  const authRef = doc(firestore, COLLECTIONS.TEAM_MEMBER_AUTH, firebaseUid);
  const authSnap = await getDoc(authRef);

  if (!authSnap.exists()) {
    return null;
  }

  return authSnap.data() as TeamMemberAuth;
}

/**
 * Update last login timestamp
 */
export async function updateLastLogin(firebaseUid: string): Promise<void> {
  const authRef = doc(firestore, COLLECTIONS.TEAM_MEMBER_AUTH, firebaseUid);
  await updateDoc(authRef, {
    lastLogin: Timestamp.now(),
  });
}

/**
 * Get bookings for a specific team member
 */
export async function getBookingsByTeamMember(
  teamMemberId: string
): Promise<Booking[]> {
  const bookingsRef = collection(firestore, COLLECTIONS.BOOKINGS);
  const q = query(
    bookingsRef,
    where('teamMemberId', '==', teamMemberId),
    orderBy('scheduledDate', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Booking[];
}

/**
 * Get all bookings (admin)
 */
export async function getAllBookings(): Promise<Booking[]> {
  const bookingsRef = collection(firestore, COLLECTIONS.BOOKINGS);
  const q = query(bookingsRef, orderBy('scheduledDate', 'desc'));

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Booking[];
}
