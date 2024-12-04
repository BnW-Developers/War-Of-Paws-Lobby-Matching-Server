class ConnectSessionManager {
  constructor() {
    this.connectSession = new Map();
  }

  addConnect(socket) {
    const key = socket.remoteAddress + ':' + socket.remotePort;
    this.connectSession.set(key, { socket: socket, sequence: 1 });
  }

  findSocketByRemoteKey(key) {
    const session = this.connectSession.get(key);
    if (!session) return null;
    return session.socket;
  }

  removeConnect(socket) {
    const key = socket.remoteAddress + ':' + socket.remotePort;
    return this.connectSession.delete(key);
  }
}

export default ConnectSessionManager;
