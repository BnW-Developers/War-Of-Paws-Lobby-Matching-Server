import { handleErr } from '../../../common/error/handlerErr.js';
import logger from '../../../common/utils/logger/logger.js';
import { createL2CPacket } from '../../../common/utils/packet/createPacket.js';
import { parseServerPacket } from '../../../common/utils/packet/parsePacket.js';
import config from '../config/lobby.config.js';
import PacketRouter from '../route/packetRouter.js';

class S2LEventHandler {
  constructor(packetRoutingMap, microserviceClientMap, connectSessionManager) {
    this.packetRoutingMap = packetRoutingMap;
    this.microserviceClientMap = microserviceClientMap;
    this.connectSessionManager = connectSessionManager;
  }

  // 연결 성공
  onConnect(socket, serviceName) {
    try {
      logger.info(`${serviceName} 서비스 연결 성공`);
      socket.buffer = Buffer.alloc(0);
    } catch (err) {
      handleErr(null, err);
    }
  }

  // 데이터 수신
  onData(socket, serviceName, data) {
    console.log('data: ', data);
    logger.info(`${serviceName} 서비스 데이터 수신`);

    socket.buffer = Buffer.concat([socket.buffer, data]);

    while (
      socket.buffer.length >=
      config.packet.server.typeLength + config.packet.server.clientKeyLength
    ) {
      try {
        // 서버로부터 받은 패킷 파싱
        const { packetType, clientKey, payload } = parseServerPacket(socket);

        // 받은 데이터를 클라이언트에게 보낼 패킷으로 생성
        const packet = createL2CPacket(packetType, 1, payload);

        // 클라이언트 소켓 검색
        const userSocket = this.connectSessionManager.findSocketByRemoteKey(clientKey);
        if (!userSocket) {
          throw new Error('onData 에러: 클라이언트를 찾을 수 없습니다.');
        }

        // 전송
        userSocket.write(packet);
      } catch (err) {
        handleErr(null, err);
      }
    }
  }

  // 서비스 연결 종료
  onEnd(options, serviceName, client) {
    try {
      const key = `${options.host}:${options.port}`;

      // microserviceClientMap에서 해당 서비스 삭제
      if (this.microserviceClientMap[key]) {
        logger.info(`${serviceName} 서비스 연결 종료: ${key}`);
        delete this.microserviceClientMap[key];
      }

      // packetRoutingMap에서 해당 서비스 인스턴스 삭제
      PacketRouter.removeMicroservice(this.packetRoutingMap, client);
    } catch (err) {
      handleErr(null, err);
    }
  }

  // 연결 에러
  onError(options, serviceName, client, err) {
    try {
      const key = `${options.host}:${options.port}`;

      console.error(`${serviceName} 서비스 연결 에러: ${key}`, err);

      // microserviceClientMap에서 해당 서비스 삭제
      if (this.microserviceClientMap[key]) {
        delete this.microserviceClientMap[key];
      }

      // packetRoutingMap에서 해당 서비스 인스턴스 삭제
      PacketRouter.removeMicroservice(this.packetRoutingMap, client);
    } catch (err) {
      handleErr(null, err);
    }
  }
}

export default S2LEventHandler;
