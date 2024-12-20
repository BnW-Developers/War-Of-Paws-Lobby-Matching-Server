import { handleErr } from '../../../common/error/handlerErr.js';
import { getDecodedPayload, parseServerPacket } from '../../../common/utils/packet/parsePacket.js';
import config from '../config/matching.config.js';
import { getHandlerByPacketType } from '../handlers/index.js';
import matchingSystem from '../matchingQueue/matchingSystem.js';

class MatchingEventHandler {
  onConnection(socket) {
    const key = `${socket.remoteAddress}:${socket.remotePort}`;
    console.log(`Lobby 서버와 연결: ${key}`);
    socket.buffer = Buffer.alloc(0);

    matchingSystem.registerSocket(socket);
  }

  async onData(socket, data) {
    try {
      socket.buffer = Buffer.concat([socket.buffer, data]);

      while (
        socket.buffer.length >=
        config.packet.server.typeLength + config.packet.server.clientKeyLength
      ) {
        const { packetType, clientKey, payload } = parseServerPacket(socket);

        const decodedPayload = getDecodedPayload(packetType, payload);

        // 여기서 이제 packetType보고 handler 실행시키도록 해야됨
        const handler = getHandlerByPacketType(packetType);
        await handler(socket, clientKey, decodedPayload);
      }
    } catch (err) {
      err.message = '매칭서버 onData 에러: ' + err.message;
      handleErr(null, err);
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
