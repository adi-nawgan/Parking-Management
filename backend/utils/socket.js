let ioInstance;

const init = (io) => {
  ioInstance = io;
  
  io.on('connection', (socket) => {
    console.log(`Socket client connected: ${socket.id}`);
    
    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });
  
  return io;
};

const getIO = () => {
  return ioInstance;
};

const emitCapacityUpdate = (data) => {
  if (ioInstance) {
    ioInstance.emit('capacityUpdate', data);
  }
};

const emitVehicleEntry = (entry) => {
  if (ioInstance) {
    ioInstance.emit('vehicleEntry', entry);
  }
};

const emitVehicleExit = (log) => {
  if (ioInstance) {
    ioInstance.emit('vehicleExit', log);
  }
};

const emitOverflowAlert = (alert) => {
  if (ioInstance) {
    ioInstance.emit('overflowAlert', alert);
  }
};

module.exports = {
  init,
  getIO,
  emitCapacityUpdate,
  emitVehicleEntry,
  emitVehicleExit,
  emitOverflowAlert
};
