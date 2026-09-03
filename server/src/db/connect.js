const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn('MONGO_URI не задан в .env — сервер запустится без базы (live-состояние комнат хранится в памяти и от базы не зависит)');
    return;
  }
  try {
    await mongoose.connect(uri);
    console.log('MongoDB подключена:', mongoose.connection.name);
  } catch (err) {
    console.error('Не удалось подключиться к MongoDB:', err.message);
    // Не валим процесс — живые комнаты (in-memory) продолжат работать,
    // просто не будет сохраняться история матчей/статистика.
  }
}

module.exports = connectDB;
