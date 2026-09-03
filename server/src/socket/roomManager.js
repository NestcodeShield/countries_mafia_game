// Живые комнаты храним в памяти процесса (Map). Это специально —
// такому состоянию не нужна персистентность между рестартами сервера,
// а задержка на чтение/запись в БД на каждый чих (выбор действия и т.п.)
// была бы лишней. В Mongo уходят только законченные матчи (см. models/MatchResult.js).

const rooms = new Map(); // code -> room

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode() {
  let code;
  do {
    code = Array.from({ length: 5 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
  } while (rooms.has(code));
  return code;
}

function createRoom({ hostSocketId, hostName, maxPlayers }) {
  const code = generateCode();
  const room = {
    code,
    minPlayers: 4,
    maxPlayers,
    hostId: hostSocketId,
    phase: 'lobby',
    players: [{ id: hostSocketId, name: hostName }],
  };
  rooms.set(code, room);
  return room;
}

function getRoom(code) {
  return rooms.get(code?.toUpperCase());
}

function joinRoom(code, { socketId, name }) {
  const room = getRoom(code);
  if (!room) return { error: 'Комната не найдена' };
  if (room.phase !== 'lobby') return { error: 'Игра уже началась' };
  if (room.players.length >= room.maxPlayers) return { error: 'Комната заполнена' };
  if (room.players.some((p) => p.id === socketId)) return { room };

  room.players.push({ id: socketId, name });
  return { room };
}

// Возвращает { room: null } если комната была удалена (ушёл хост),
// либо { room } с уже обновлённым списком игроков.
function leaveRoom(code, socketId) {
  const room = getRoom(code);
  if (!room) return { room: null };

  if (room.hostId === socketId) {
    rooms.delete(room.code);
    return { room: null, closed: true };
  }

  room.players = room.players.filter((p) => p.id !== socketId);
  return { room };
}

// Вызывается при обрыве соединения (закрыл вкладку и т.п.) —
// нужно найти комнату игрока по socketId, не зная кода заранее.
function leaveAllRoomsForSocket(socketId) {
  for (const room of rooms.values()) {
    if (room.players.some((p) => p.id === socketId)) {
      return leaveRoom(room.code, socketId).closed
        ? { code: room.code, closed: true }
        : { code: room.code, closed: false, room: getRoom(room.code) };
    }
  }
  return null;
}

function canStart(room) {
  return room.players.length >= room.minPlayers;
}

module.exports = {
  createRoom,
  getRoom,
  joinRoom,
  leaveRoom,
  leaveAllRoomsForSocket,
  canStart,
};
