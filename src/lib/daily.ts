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
          start_cloud_recording: true,
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

/**
 * Formats a Daily.co meeting for storage in Firestore
 *
 * @param room - Daily.co room object
 * @returns Formatted meeting object for Firestore
 */
export function formatMeetingForFirestore(room: DailyRoom) {
  return {
    provider: 'daily' as const,
    roomId: room.id,
    roomName: room.name,
    joinUrl: room.url,
    createdAt: room.created_at,
    expiresAt: room.config.exp ? new Date(room.config.exp * 1000).toISOString() : null,
    recordingEnabled: true,
    recordingStatus: 'recording' as const,
  };
}
