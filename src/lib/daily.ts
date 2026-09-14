/**
 * Daily.co Video Platform Integration
 *
 * This module provides functions to create and manage Daily.co video rooms
 * for virtual ministry sessions.
 */

export interface DailyRoom {
  id: string;
  name: string;
  url: string;
  privacy: 'public' | 'private';
  created_at: string;
  config: {
    start_video_off?: boolean;
    start_audio_off?: boolean;
    exp?: number; // Unix timestamp for room expiration
  };
}

export interface CreateRoomOptions {
  sessionName: string;
  startTime: Date;
  duration: number; // minutes
  attendeeName: string;
  teamMemberName: string;
}

/**
 * Creates a Daily.co video room for a ministry session
 *
 * @param options - Room configuration options
 * @returns Daily.co room details including join URL
 * @throws Error if room creation fails
 */
export async function createDailyRoom(
  options: CreateRoomOptions
): Promise<DailyRoom> {
  const apiKey = process.env.DAILY_API_KEY;

  if (!apiKey) {
    throw new Error('DAILY_API_KEY is not configured');
  }

  // Generate a unique room name
  const timestamp = Date.now();
  const roomName = `ministry-session-${timestamp}`;

  // Calculate expiration time (24 hours after session end)
  const expirationTime = new Date(options.startTime);
  expirationTime.setMinutes(expirationTime.getMinutes() + options.duration + 1440); // +24 hours
  const expTimestamp = Math.floor(expirationTime.getTime() / 1000);

  try {
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        name: roomName,
        // Private rooms cannot be entered by anyone holding the URL. The attendee
        // knocks and waits in the lobby; the team member joins with an owner token
        // (see createMeetingToken) and admits them. Note that enable_knocking below
        // only has an effect on private rooms.
        privacy: 'private',
        properties: {
          exp: expTimestamp,
          enable_screenshare: true,
          enable_chat: true,
          start_video_off: false,
          start_audio_off: false,
          enable_knocking: true,
          enable_prejoin_ui: true,
          // Automatic cloud recording for accountability
          enable_recording: 'cloud',
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Daily.co API error:', errorData);
      throw new Error(`Failed to create Daily.co room: ${response.statusText}`);
    }

    const room: DailyRoom = await response.json();

    console.log('Daily.co room created successfully:', {
      roomName: room.name,
      url: room.url,
      sessionName: options.sessionName,
    });

    return room;
  } catch (error) {
    console.error('Error creating Daily.co room:', error);
    throw error;
  }
}

/**
 * Deletes a Daily.co room
 *
 * @param roomName - The name of the room to delete
 * @throws Error if deletion fails
 */
export async function deleteDailyRoom(roomName: string): Promise<void> {
  const apiKey = process.env.DAILY_API_KEY;

  if (!apiKey) {
    throw new Error('DAILY_API_KEY is not configured');
  }

  try {
    const response = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Daily.co API error:', errorData);
      throw new Error(`Failed to delete Daily.co room: ${response.statusText}`);
    }

    console.log('Daily.co room deleted successfully:', roomName);
  } catch (error) {
    console.error('Error deleting Daily.co room:', error);
    throw error;
  }
}

/**
 * Gets Daily.co room details
 *
 * @param roomName - The name of the room to retrieve
 * @returns Daily.co room details
 * @throws Error if retrieval fails
 */
export async function getDailyRoom(roomName: string): Promise<DailyRoom> {
  const apiKey = process.env.DAILY_API_KEY;

  if (!apiKey) {
    throw new Error('DAILY_API_KEY is not configured');
  }

  try {
    const response = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Daily.co API error:', errorData);
      throw new Error(`Failed to get Daily.co room: ${response.statusText}`);
    }

    const room: DailyRoom = await response.json();
    return room;
  } catch (error) {
    console.error('Error getting Daily.co room:', error);
    throw error;
  }
}

export interface CreateMeetingTokenOptions {
  roomName: string;
  userName: string;
  isOwner: boolean;
  /** Unix timestamp (seconds) after which the token stops working */
  expiresAt: number;
}

/**
 * Creates a Daily.co meeting token.
 *
 * Rooms are private, so a token is what actually gets someone into the call.
 * The team member is issued an owner token, which lets them admit the attendee
 * from the lobby. Without an owner in the room, nobody can be admitted at all.
 *
 * @param options - Token configuration options
 * @returns The meeting token string, to be appended to the room URL as `?t=`
 * @throws Error if token creation fails
 */
export async function createMeetingToken(
  options: CreateMeetingTokenOptions
): Promise<string> {
  const apiKey = process.env.DAILY_API_KEY;

  if (!apiKey) {
    throw new Error('DAILY_API_KEY is not configured');
  }

  // Refuse to mint a token that never expires — Daily treats a missing exp as
  // permanent, which would leave a working host credential in an inbox forever.
  if (!Number.isFinite(options.expiresAt) || options.expiresAt <= 0) {
    throw new Error('createMeetingToken requires a valid expiresAt timestamp');
  }

  try {
    const response = await fetch('https://api.daily.co/v1/meeting-tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        properties: {
          room_name: options.roomName,
          is_owner: options.isOwner,
          user_name: options.userName,
          exp: options.expiresAt,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Daily.co API error:', errorData);
      throw new Error(`Failed to create Daily.co meeting token: ${response.statusText}`);
    }

    const { token } = await response.json();

    if (!token) {
      throw new Error('Daily.co returned no meeting token');
    }

    return token;
  } catch (error) {
    console.error('Error creating Daily.co meeting token:', error);
    throw error;
  }
}

/**
 * Appends a meeting token to a room URL.
 *
 * Use this for every team-facing join link. A team member who opens the bare
 * room URL has no owner token, so they land in the lobby with nobody able to
 * admit them.
 *
 * @param joinUrl - The Daily.co room URL
 * @param token - A meeting token, or undefined for bookings made before tokens existed
 * @returns The room URL with the token attached, or the bare URL if there is no token
 */
export function withMeetingToken(joinUrl: string, token?: string): string {
  return token ? `${joinUrl}?t=${token}` : joinUrl;
}

/**
 * Formats a Daily.co meeting for storage in Firestore
 *
 * @param room - Daily.co room object
 * @param ownerToken - Owner meeting token for the team member
 * @returns Formatted meeting object for Firestore
 */
export function formatMeetingForFirestore(room: DailyRoom, ownerToken?: string) {
  return {
    provider: 'daily' as const,
    roomId: room.id,
    roomName: room.name,
    joinUrl: room.url,
    // Owner token for the team member. The attendee is given the bare joinUrl
    // and knocks; the team member admits them with this.
    ownerToken,
    createdAt: room.created_at,
    expiresAt: room.config.exp ? new Date(room.config.exp * 1000).toISOString() : null,
    recordingEnabled: true,
    recordingStatus: 'recording' as const,
  };
}
