import { handleErr } from '../../../common/error/handlerErr.js';
import logger from '../../../common/utils/logger/logger.js';
import { sendConnectionInfo } from '../notification/sendConnectionInfo.js';

class DistributorEventHandler {
  constructor(map) {
    this.map = map;
  }

  // Distributor에 다른 서버가 접속했을 때 이벤트
  onConnection(socket) {
    logger.info(`onConnect ${socket.remoteAddress}:${socket.remotePort}`);

    // 소켓 버퍼 할당
    socket.buffer = Buffer.alloc(0);

    // 접속한 서버에게 현재 접속 중인 서버 알림
    sendConnectionInfo(socket, this.map);
  }

  /**서버로부터 데이터를 수신했을 때 이벤트
   * 서버에 데이터를 보내는 경우는 Distributor에 처음 접속했을 때 밖에 없다
   * 접속한 서버의 정보를 받아서 다른 모든 서버들에게 정보를 전송해준다.
   */
  onData(socket, data) {
    const key = socket.remoteAddress + ':' + socket.remotePort;
    logger.info(`Distributor onData key: ${key} \n raw data: ${data}`);

    try {
      // 버퍼를 문자열로 변환 후 JSON 파싱
      const parsedData = JSON.parse(data.toString());

      logger.info(`Parsed Data: ${JSON.stringify(parsedData, null)}`);

      // 접속 중인 서버를 저장하는 map에 저장
      this.map[key] = {
        socket: socket,
        info: parsedData.context,
        servicePackets: parsedData.packets,
      };

      // 모든 서버들에게 정보 전송
      sendConnectionInfo(null, this.map);
    } catch (error) {
      error.message = 'Distributor onData Error: ' + error.message;
      handleErr(null, error);
    }
  }

  // 서버 접속 해제. 접속이 해제된 것도 모든 서버에게 알림
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
