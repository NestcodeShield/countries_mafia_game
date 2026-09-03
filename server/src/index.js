require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const connectDB = require('./db/connect');
const registerRoomHandlers = require('./socket/roomHandlers');

const PORT = process.env.PORT || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CLIENT_ORIGIN, methods: ['GET', 'POST'] },
});

io.on('connection', (socket) => {
  console.log('Подключился сокет:', socket.id);
  registerRoomHandlers(io, socket);
});

async function start() {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`Сервер слушает http://localhost:${PORT}`);
  });
}

start();
