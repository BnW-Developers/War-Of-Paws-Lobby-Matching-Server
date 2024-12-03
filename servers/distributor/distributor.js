import TcpServer from '../../common/classes/models/tcpServer.js';
import config from './config/distributor.config.js';
import DistributorEventHandler from './events/distributor.event.js';

// distributor
class distributor extends TcpServer {
  constructor() {
    const map = {};
    const eventHandler = new DistributorEventHandler(map);
    super('distributor', config.distributor.host, config.distributor.port, eventHandler);
    this.map = map;
  }
}

new distributor();
