import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: SocketIOServer;

export function initIO(server: HttpServer): SocketIOServer {
    io = new SocketIOServer(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
        transports: ['polling', 'websocket'],
        allowUpgrades: true,
        pingTimeout: 30000,
        pingInterval: 25000,
    });

    io.on('connection', (socket) => {
        console.log(`🔔 Socket connected: ${socket.id}`);
        socket.on('disconnect', () => {
            console.log(`🔕 Socket disconnected: ${socket.id}`);
        });
    });

    return io;
}

export function getIO(): SocketIOServer {
    if (!io) throw new Error('Socket.io not initialized. Call initIO() first.');
    return io;
}
