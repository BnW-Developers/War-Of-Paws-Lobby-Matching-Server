import { handleErr } from '../../../common/error/handlerErr.js';
import logger from '../../../common/utils/logger/logger.js';
import { sendConnectionInfo } from '../notification/sendConnectionInfo.js';

class DistributorEventHandler {
  constructor(map) {
    this.map = map;
  }

  onConnection(socket) {
    logger.info(`onConnect ${socket.remoteAddress}:${socket.remotePort}`);
    socket.buffer = Buffer.alloc(0);
    sendConnectionInfo(socket, this.map);
  }

  onData(socket, data) {
    const key = socket.remoteAddress + ':' + socket.remotePort;
    logger.info(`Distributor onData key: ${key} \n raw data: ${data}`);

    try {
      // 버퍼를 문자열로 변환 후 JSON 파싱
      const parsedData = JSON.parse(data.toString());

      logger.info(`Parsed Data: ${JSON.stringify(parsedData, null)}`);

      this.map[key] = {
        socket: socket,
        info: parsedData.context,
        servicePackets: parsedData.packets,
      };
      sendConnectionInfo(null, this.map);
    } catch (error) {
      error.message = 'Distributor onData Error: ' + error.message;
      handleErr(null, error);
    }
  }

  onEnd(socket) {
    const key = socket.remoteAddress + ':' + socket.remotePort;
    logger.info(`onEnd ${key}`);
    delete this.map[key];
    sendConnectionInfo(null, this.map);
  }

  onError(socket, err) {
    const key = socket.remoteAddress + ':' + socket.remotePort;
    logger.info(`onError ${key}`);
    delete this.map[key];
    sendConnectionInfo(null, this.map);
  }
}

export default DistributorEventHandler;
