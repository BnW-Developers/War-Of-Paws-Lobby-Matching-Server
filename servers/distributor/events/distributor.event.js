import { sendConnectionInfo } from '../notification/sendConnectionInfo.js';

class DistributorEventHandler {
  construct(map) {
    this.map = map;
  }

  onConnection(socket) {
    console.log(`onConnect ${socket.remoteAddress}:${socket.remotePort}`);
    socket.buffer = Buffer.alloc(0);
    sendConnectionInfo(socket, this.map);
  }

  onData(socket, data) {
    const key = socket.remoteAddress + ':' + socket.remotePort;
    console.log(`Distributor onData key: ${key} \n raw data: ${data}`);

    try {
      // 버퍼를 문자열로 변환 후 JSON 파싱
      const parsedData = JSON.parse(data.toString());

      console.log('Parsed Data:', parsedData);

      this.map[key] = {
        socket: socket,
        info: parsedData.context,
        servicePackets: parsedData.packets,
      };
      sendConnectionInfo(null, this.map);
    } catch (error) {
      console.error('Error parsing data:', error);
    }
  }

  onEnd(socket) {
    const key = socket.remoteAddress + ':' + socket.remotePort;
    console.log(`onEnd ${key}`);
    delete this.map[key];
    sendConnectionInfo(null, this.map);
  }

  onError(socket, err) {
    const key = socket.remoteAddress + ':' + socket.remotePort;
    console.log(`onError ${key}`);
    console.error(err);
    delete this.map[key];
    sendConnectionInfo(null, this.map);
  }
}

export default DistributorEventHandler;
