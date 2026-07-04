export function createRoomWebSocketUrl(roomId: string, token: string) {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const url = new URL(`${proto}://${location.host}/ws/${roomId}`);
  url.searchParams.set('token', token);
  return url.toString();
}
