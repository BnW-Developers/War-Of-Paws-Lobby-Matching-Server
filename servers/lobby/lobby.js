import TcpClient from '../../common/classes/models/tcpClient.js';
import TcpServer from '../../common/classes/models/tcpServer.js';
import { handleErr } from '../../common/error/handlerErr.js';
import logger from '../../common/utils/logger/logger.js';
import config from './config/lobby.config.js';
import C2LEventHandler from './events/C2Lobby.event.js';
import S2LEventHandler from './events/S2Lobby.event.js';
import PacketRouter from './route/packetRouter.js';
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

    // S2Lobby 이벤트 핸들러
    this.s2LobbyEventHandler = new S2LEventHandler(
      this.packetRoutingMap,
      this.microserviceClientMap,
    );

    this.connectToDistributor(
      config.distributor.host,
      config.distributor.port,
      this.handleDistributorData,
    );
  }

  // distributor로 부터 온 microservice와 연결
  handleDistributorData = (jsonData) => {
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
            (options) => this.s2LobbyEventHandler.onConnect(options, node.info.name),
            (options, data) => this.s2LobbyEventHandler.onData(options, node.info.name, data),
            (options) => this.s2LobbyEventHandler.onEnd(options, node.info.name, client),
            (options, err) =>
              this.s2LobbyEventHandler.onError(options, node.info.name, client, err),
          );

          // 마이크로서비스 클라이언트 맵에 추가
          this.microserviceClientMap[key] = {
            client: client,
            info: node.info,
          };

          PacketRouter.registerMicroservice(this.packetRoutingMap, node, client);
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
