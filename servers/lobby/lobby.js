import TcpClient from '../../common/classes/models/tcpClient.js';
import TcpServer from '../../common/classes/models/tcpServer.js';
import { handleErr } from '../../common/error/handlerErr.js';
import logger from '../../common/utils/logger/logger.js';
import config from './config/lobby.config.js';
import C2LEventHandler from './events/C2Lobby.event.js';
import ConnectSessionManager from './sessions/connectSessionManager.js';

class LobbyServer extends TcpServer {
  constructor() {
    // 연결된 유저들 관리하는 매니저
    const connectSessionManager = new ConnectSessionManager();
    const packetRoutingMap = {};
    const eventHandler = new C2LEventHandler(packetRoutingMap, connectSessionManager);
    super('lobby', config.lobby.host, config.lobby.port, eventHandler);

    // 마이크로서비스 클라이언트 맵
    this.microserviceClientMap = {};

    // 패킷 라우팅 맵
    this.packetRoutingMap = packetRoutingMap;

    this.connectToDistributor(
      config.distributor.host,
      config.distributor.port,
      this.handleDistributorData,
    );
  }

  // distributor로 부터 온 microservice와 연결
  handleDistributorData = (jsonData) => {
    console.log('jsonData: ', jsonData);
    try {
      const data = JSON.parse(jsonData);
      logger.info(`data: ${JSON.stringify(data, null)}`);

      for (const node of data.microservices) {
        // lobby 서버는 제외
        if (node.info.name === 'lobby') continue;

        const key = `${node.info.host}:${node.info.port}`;

        // 이미 연결된 마이크로서비스인지 확인
        if (!this.microserviceClientMap[key]) {
          const client = new TcpClient(
            node.info.host,
            node.info.port,
            (options) => logger.info(`${node.info.name} 서비스 연결 성공`),
            (options, data) => logger.info(`${node.info.name} 서비스 데이터 수신 \ndata: ${data}`),
            (options) => logger.info(`${node.info.name} 서비스 연결 종료`),
            (options, err) => console.error(`${node.info.name} 서비스 연결 에러`, err),
          );

          // 마이크로서비스 클라이언트 맵에 추가
          this.microserviceClientMap[key] = {
            client: client,
            info: node.info,
          };

          client.connect();
        }
      }
    } catch (err) {
      err.message = 'Distributor 데이터 처리 중 오류' + err.message;
      handleErr(null, err);
    }
  };
}

new LobbyServer();
