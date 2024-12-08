import TcpServer from '../../common/classes/models/tcpServer.js';
import { handleErr } from '../../common/error/handlerErr.js';
import logger from '../../common/utils/logger/logger.js';
import config from './config/matching.config.js';
import MatchingDisconnectHandler from './events/disconnect.handler.js';
import MatchingEventHandler from './events/matching.event.js';

class MatchingServer extends TcpServer {
  constructor() {
    const eventHandler = new MatchingEventHandler();

    super('matching', config.matching.host, config.matching.port, eventHandler);
    this.userDisconnectEvent = new MatchingDisconnectHandler();
    this.connectToDistributor(
      config.distributor.host,
      config.distributor.port,
      this.handleDistributorData,
      config.services,
    );
  }

  handleDistributorData = (jsonData) => {
    try {
      const data = JSON.parse(jsonData);
      logger.info(`data: ${JSON.stringify(data, null)}`);
    } catch (err) {
      err.message = 'Distributor 데이터 처리 중 오류' + err.message;
      handleErr(null, err);
    }
  };
}

new MatchingServer();
