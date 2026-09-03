const mongoose = require('mongoose');

// Живое состояние комнаты (кто в лобби, чей сейчас ход и т.д.) хранится
// в памяти сервера — это не то, для чего нужна БД, оно эфемерно и должно
// отвечать мгновенно. Mongo здесь только для того, что должно пережить
// рестарт сервера: результаты сыгранных матчей, статистика игроков и т.п.

const matchResultSchema = new mongoose.Schema(
  {
    roomCode: { type: String, required: true },
    players: [
      {
        name: String,
        country: String,
        survived: Boolean,
        finalStock: {
          bombs: Number,
          shields: Number,
          reforms: Number,
        },
      },
    ],
    winnersCount: { type: Number, required: true }, // сколько стран осталось в живых (обычно 3)
    startedAt: Date,
    endedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('MatchResult', matchResultSchema);
