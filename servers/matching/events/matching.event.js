import { parseServerPacket } from '../../../common/utils/packet/parsePacket.js';
import config from '../config/matching.config.js';

class MatchingEventHandler {
  onConnection(socket) {
    console.log(`Lobby 서버와 연결: ${socket.remoteAddress}:${socket.remotePort}`);
    socket.buffer = Buffer.alloc(0);
  }

  onData(socket, data) {
    console.log(`Matching 서버에서 받은 데이터: ${data}`);
    socket.buffer = Buffer.concat([socket.buffer, data]);

    while (
      socket.buffer.length >=
      config.packet.server.typeLength + config.packet.server.clientKeyLength
    ) {
      const { packetType, clientKey, payload } = parseServerPacket(socket);

      // 여기서 이제 packetType보고 handler 실행시키도록 해야됨
    }
  }

  onEnd(socket) {
    console.log('onEnd', socket.remoteAddress, socket.remotePort);
  }

  onError(socket, err) {
    console.log('onError', socket.remoteAddress, socket.remotePort);
    console.error(err);
  }
}

export default MatchingEventHandler;
