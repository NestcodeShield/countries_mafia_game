const roomManager = require('./roomManager');

function registerRoomHandlers(io, socket) {
  socket.on('createRoom', ({ name, maxPlayers }, callback) => {
    if (!name?.trim()) return callback?.({ error: 'Введите имя' });
    const max = Math.min(9, Math.max(4, Number(maxPlayers) || 6));

    const room = roomManager.createRoom({
      hostSocketId: socket.id,
      hostName: name.trim(),
      maxPlayers: max,
    });

    socket.join(room.code);
    callback?.({ room });
  });

  socket.on('joinRoom', ({ name, code }, callback) => {
    if (!name?.trim()) return callback?.({ error: 'Введите имя' });
    if (!code?.trim()) return callback?.({ error: 'Введите код комнаты' });

    const { room, error } = roomManager.joinRoom(code, { socketId: socket.id, name: name.trim() });
    if (error) return callback?.({ error });

    socket.join(room.code);
    callback?.({ room });
    // остальным игрокам в комнате шлём обновлённый список
    socket.to(room.code).emit('roomUpdate', room);
  });

  socket.on('leaveRoom', ({ code }, callback) => {
    const { room, closed } = roomManager.leaveRoom(code, socket.id);
    socket.leave(code);

    if (closed) {
      // хост вышел — комната удалена, гоним остальных обратно в меню
      io.to(code).emit('roomClosed');
    } else if (room) {
      io.to(code).emit('roomUpdate', room);
    }
    callback?.({ ok: true });
  });

  socket.on('startGame', ({ code }, callback) => {
    const room = roomManager.getRoom(code);
    if (!room) return callback?.({ error: 'Комната не найдена' });
    if (room.hostId !== socket.id) return callback?.({ error: 'Только создатель может начать игру' });
    if (!roomManager.canStart(room)) {
      return callback?.({ error: `Нужно минимум ${room.minPlayers} игроков` });
    }

    room.phase = 'night';
    io.to(code).emit('gameStarted', room);
    // TODO: следующий шаг — назначение стран без повторов и таймер ночной фазы (60с)
    callback?.({ ok: true });
  });

  socket.on('disconnect', () => {
    const result = roomManager.leaveAllRoomsForSocket(socket.id);
    if (!result) return;

    if (result.closed) {
      io.to(result.code).emit('roomClosed');
    } else if (result.room) {
      io.to(result.code).emit('roomUpdate', result.room);
    }
  });
}

module.exports = registerRoomHandlers;
