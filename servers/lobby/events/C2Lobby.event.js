import logger from '../../../common/utils/logger/logger.js';
import config from '../config/lobby.config.js';
import PacketRouter from '../route/packetRouter.js';
import { parsePacket } from '../utils/parser/packetParser.js';

/**
 * 클라이언트(유저)가 게이트로 연결을 맺고 요청을 보낼 때를 정의
 * 유저가 보낸 패킷을 파싱하고 패킷타입 확인
 * 패킷 타입에 따라 적절한 마이크로서비스로 전달
 */
class C2LEventHandler {
  constructor(packetRoutingMap, connectSessionManager) {
    this.packetRoutingMap = packetRoutingMap;
    this.connectSessionManager = connectSessionManager;
  }

  onConnection(socket) {
    const key = `${socket.remoteAddress}:${socket.remotePort}`;
    logger.info(`클라이언트 연결: ${key}`);
    this.connectSessionManager.addConnect(socket);
    socket.buffer = Buffer.alloc(0);
  }

  onData(socket, data) {
    try {
      console.log(`gate data from ${socket.remoteAddress}:${socket.remotePort}`);
      socket.buffer = Buffer.concat([socket.buffer, data]);
      const typeAndVersionLength =
        config.packet.client.typeLength + config.packet.client.versionLength;

      while (socket.buffer.length >= typeAndVersionLength) {
        const packet = parsePacket(socket);
        console.log('packet: ', packet);

        if (!packet) break;

        // 패킷 라우팅
        const routeSuccess = PacketRouter.routePacket(this.packetRoutingMap, socket, packet);

        if (!routeSuccess) {
          console.warn(`패킷 라우팅 실패: ${packet.packetType}`);
        }
      }
    } catch (err) {
      console.error('Gate onData 오류:', err);
    }
  }

  onEnd(socket) {
    this.connectSessionManager.removeConnect(socket);
    console.log(`클라이언트 연결 종료: ${socket.remoteAddress}:${socket.remotePort}`);
  }

  onError(socket, err) {
    this.connectSessionManager.removeConnect(socket);
    console.error(`클라이언트 오류 발생: ${socket.remoteAddress}:${socket.remotePort}`, err);
  }
}

export default C2LEventHandler;
