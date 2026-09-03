import { useState } from 'react';
import './NuclearLobby.css';

// Демо-компонент экрана лобби/комнаты.
// Реальные сокет-события (создание/присоединение/старт) сюда пробрасываются
// через пропсы onCreateRoom / onJoinRoom / onStartGame — сейчас они замоканы
// локальным стейтом, чтобы можно было увидеть весь флоу целиком.

const MOCK_SELF_ID = 'you';

function makeRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function NuclearLobby() {
  const [screen, setScreen] = useState('name'); // name | choice | create | join | room
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [room, setRoom] = useState(null);
  const [error, setError] = useState('');

  function submitName(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Введите имя');
      return;
    }
    setError('');
    setScreen('choice');
  }

  function createRoom() {
    setRoom({
      code: makeRoomCode(),
      minPlayers: 4,
      maxPlayers,
      hostId: MOCK_SELF_ID,
      players: [{ id: MOCK_SELF_ID, name: name.trim() }],
    });
    setScreen('room');
  }

  function joinRoom(e) {
    e.preventDefault();
    if (joinCode.trim().length < 4) {
      setError('Введите код комнаты');
      return;
    }
    setError('');
    // мок: считаем, что подключились к чужой комнате с парой игроков
    setRoom({
      code: joinCode.trim().toUpperCase(),
      minPlayers: 4,
      maxPlayers: 6,
      hostId: 'host-1',
      players: [
        { id: 'host-1', name: 'Ковалёв' },
        { id: MOCK_SELF_ID, name: name.trim() },
      ],
    });
    setScreen('room');
  }

  function addMockPlayer() {
    if (!room || room.players.length >= room.maxPlayers) return;
    const pool = ['Орлова', 'Сидельников', 'Гранин', 'Латышева', 'Марков', 'Ивченко', 'Реутов'];
    const used = new Set(room.players.map((p) => p.name));
    const next = pool.find((n) => !used.has(n)) || `Игрок ${room.players.length + 1}`;
    setRoom({
      ...room,
      players: [...room.players, { id: `p-${room.players.length}`, name: next }],
    });
  }

  const isHost = room?.hostId === MOCK_SELF_ID;
  const canStart = room && room.players.length >= room.minPlayers;

  return (
    <div className="nl-root">
      <div className="nl-scanline" aria-hidden="true" />

      {screen === 'name' && (
        <div className="nl-panel nl-panel--narrow">
          <div className="nl-corner nl-corner--tl" />
          <div className="nl-corner nl-corner--br" />
          <p className="nl-eyebrow">брифинг</p>
          <h1 className="nl-title">Введите позывной</h1>
          <form onSubmit={submitName} className="nl-form">
            <input
              className="nl-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ваше имя"
              maxLength={16}
              autoFocus
            />
            {error && <p className="nl-error">{error}</p>}
            <button className="nl-btn nl-btn--primary" type="submit">
              Продолжить
            </button>
          </form>
        </div>
      )}

      {screen === 'choice' && (
        <div className="nl-panel nl-panel--narrow">
          <div className="nl-corner nl-corner--tl" />
          <div className="nl-corner nl-corner--br" />
          <p className="nl-eyebrow">позывной: {name}</p>
          <h1 className="nl-title">Выберите действие</h1>
          <div className="nl-stack">
            <button className="nl-btn nl-btn--primary" onClick={() => setScreen('create')}>
              Создать комнату
            </button>
            <button className="nl-btn" onClick={() => setScreen('join')}>
              Присоединиться по коду
            </button>
          </div>
        </div>
      )}

      {screen === 'create' && (
        <div className="nl-panel nl-panel--narrow">
          <div className="nl-corner nl-corner--tl" />
          <div className="nl-corner nl-corner--br" />
          <p className="nl-eyebrow">новая комната</p>
          <h1 className="nl-title">Количество игроков</h1>
          <div className="nl-range-row">
            <input
              type="range"
              min={4}
              max={9}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
              className="nl-range"
            />
            <span className="nl-range-value">{maxPlayers}</span>
          </div>
          <p className="nl-hint">Минимум 4 — максимум 9 игроков</p>
          <div className="nl-stack">
            <button className="nl-btn nl-btn--primary" onClick={createRoom}>
              Создать
            </button>
            <button className="nl-btn nl-btn--ghost" onClick={() => setScreen('choice')}>
              Назад
            </button>
          </div>
        </div>
      )}

      {screen === 'join' && (
        <div className="nl-panel nl-panel--narrow">
          <div className="nl-corner nl-corner--tl" />
          <div className="nl-corner nl-corner--br" />
          <p className="nl-eyebrow">присоединение</p>
          <h1 className="nl-title">Код комнаты</h1>
          <form onSubmit={joinRoom} className="nl-form">
            <input
              className="nl-input nl-input--code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="XXXXX"
              maxLength={5}
              autoFocus
            />
            {error && <p className="nl-error">{error}</p>}
            <div className="nl-stack">
              <button className="nl-btn nl-btn--primary" type="submit">
                Войти
              </button>
              <button
                type="button"
                className="nl-btn nl-btn--ghost"
                onClick={() => setScreen('choice')}
              >
                Назад
              </button>
            </div>
          </form>
        </div>
      )}

      {screen === 'room' && room && (
        <div className="nl-panel nl-panel--wide">
          <div className="nl-corner nl-corner--tl" />
          <div className="nl-corner nl-corner--br" />

          <div className="nl-room-header">
            <div>
              <p className="nl-eyebrow">комната ожидания</p>
              <h1 className="nl-title">
                {room.players.length} / {room.maxPlayers}
              </h1>
            </div>
            <div className="nl-code-box">
              <span className="nl-code-label">код</span>
              <span className="nl-code">{room.code}</span>
            </div>
          </div>

          <ul className="nl-roster">
            {room.players.map((p, i) => (
              <li key={p.id} className="nl-roster-row">
                <span className="nl-roster-index">{String(i + 1).padStart(2, '0')}</span>
                <span className="nl-roster-name">
                  {p.name}
                  {p.id === room.hostId && (
                    <span className="nl-crown" title="Создатель комнаты">
                      ♛
                    </span>
                  )}
                </span>
                {p.id === MOCK_SELF_ID && <span className="nl-you">вы</span>}
              </li>
            ))}
            {Array.from({ length: room.maxPlayers - room.players.length }).map((_, i) => (
              <li key={`empty-${i}`} className="nl-roster-row nl-roster-row--empty">
                <span className="nl-roster-index">
                  {String(room.players.length + i + 1).padStart(2, '0')}
                </span>
                <span className="nl-roster-name nl-roster-name--empty">ожидание</span>
              </li>
            ))}
          </ul>

          {isHost ? (
            <>
              <button
                className="nl-btn"
                style={{ marginBottom: 12 }}
                onClick={addMockPlayer}
                disabled={room.players.length >= room.maxPlayers}
              >
                (демо) добавить игрока
              </button>
              <button
                className="nl-btn nl-btn--primary"
                disabled={!canStart}
                title={!canStart ? `Нужно минимум ${room.minPlayers} игроков` : ''}
              >
                {canStart ? 'Начать игру' : `Ждём игроков (мин. ${room.minPlayers})`}
              </button>
            </>
          ) : (
            <p className="nl-hint">Ожидание, пока создатель комнаты начнёт игру…</p>
          )}
        </div>
      )}
    </div>
  );
}