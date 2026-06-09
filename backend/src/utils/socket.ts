import { Server as SocketServer, Socket } from 'socket.io';

let ioInstance: SocketServer | null = null;

const init = (io: SocketServer): SocketServer => {
  ioInstance = io;

  io.on('connection', (socket: Socket) => {
    console.log(`Socket client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = (): SocketServer | null => {
  return ioInstance;
};

const emitCapacityUpdate = (data: object): void => {
  if (ioInstance) {
    ioInstance.emit('capacityUpdate', data);
  }
};

const emitVehicleEntry = (entry: object): void => {
  if (ioInstance) {
    ioInstance.emit('vehicleEntry', entry);
  }
};

const emitVehicleExit = (log: object): void => {
  if (ioInstance) {
    ioInstance.emit('vehicleExit', log);
  }
};

const emitOverflowAlert = (alert: object): void => {
  if (ioInstance) {
    ioInstance.emit('overflowAlert', alert);
  }
};

export { init, getIO, emitCapacityUpdate, emitVehicleEntry, emitVehicleExit, emitOverflowAlert };
