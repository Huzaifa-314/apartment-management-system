import { api } from './api';
import type { Room, RoomAvailabilityBulkResponse, RoomAvailabilityResponse } from '../types';

type PublicRoomResponse = { room: Room };
type PublicRoomsResponse = { rooms: Room[] };

export async function fetchPublicRoom(roomId: string): Promise<Room> {
  const { data } = await api.get<PublicRoomResponse>(`/api/rooms/public/${roomId}`);
  return data.room;
}

export async function fetchPublicRoomsWithUpcoming(): Promise<Room[]> {
  const { data } = await api.get<PublicRoomsResponse>('/api/rooms/public?include=all');
  return data.rooms;
}

export async function fetchRoomAvailability(
  roomId: string,
  from: Date,
  to: Date
): Promise<RoomAvailabilityResponse> {
  const { data } = await api.get<RoomAvailabilityResponse>(
    `/api/rooms/public/${roomId}/availability`,
    { params: { from: from.toISOString(), to: to.toISOString() } }
  );
  return data;
}

export async function fetchRoomsAvailabilityBulk(
  from: Date,
  to: Date,
  roomIds?: string[]
): Promise<RoomAvailabilityBulkResponse> {
  const { data } = await api.get<RoomAvailabilityBulkResponse>('/api/rooms/public/availability', {
    params: {
      from: from.toISOString(),
      to: to.toISOString(),
      ...(roomIds?.length ? { roomIds: roomIds.join(',') } : {}),
    },
  });
  return data;
}
