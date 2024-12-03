import logger from '../../../common/utils/logger/logger.js';
import PacketRouter from '../route/packetRouter.js';

class S2LEventHandler {
  constructor(packetRoutingMap, microserviceClientMap) {
    this.packetRoutingMap = packetRoutingMap;
    this.microserviceClientMap = microserviceClientMap;
  }

  // 연결 성공
  onConnect(options, serviceName) {
    logger.info(`${serviceName} 서비스 연결 성공`);
  }

  // 데이터 수신
  onData(options, serviceName, data) {
    logger.info(`${serviceName} 서비스 데이터 수신 \ndata: ${data}`);
  }

  // 서비스 연결 종료
  onEnd(options, serviceName, client) {
    const key = `${options.host}:${options.port}`;

    // microserviceClientMap에서 해당 서비스 삭제
    if (this.microserviceClientMap[key]) {
      logger.info(`${serviceName} 서비스 연결 종료: ${key}`);
      delete this.microserviceClientMap[key];
    }

    // packetRoutingMap에서 해당 서비스 인스턴스 삭제
    PacketRouter.removeMicroservice(this.packetRoutingMap, client);
  }

  // 연결 에러
  onError(options, serviceName, client, err) {
    const key = `${options.host}:${options.port}`;

    console.error(`${serviceName} 서비스 연결 에러: ${key}`, err);

    // microserviceClientMap에서 해당 서비스 삭제
    if (this.microserviceClientMap[key]) {
      delete this.microserviceClientMap[key];
    }

    // packetRoutingMap에서 해당 서비스 인스턴스 삭제
    PacketRouter.removeMicroservice(this.packetRoutingMap, client);
  }
}

export default S2LEventHandler;
