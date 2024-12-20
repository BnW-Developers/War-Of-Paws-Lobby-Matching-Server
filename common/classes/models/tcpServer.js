import net from 'net';
import TcpClient from './tcpClient.js';
import logger from '../../utils/logger/logger.js';
import { handleErr } from '../../error/handlerErr.js';

// 서버 클래스
class TcpServer {
  constructor(name, host, port, event) {
    if (new.target === TcpServer) {
      throw new Error('TcpServer 클래스는 직접 인스턴스화할 수 없습니다.');
    }
    // 서버 상태 정보
    this.context = {
      host: host,
      port: port,
      name: name,
    };

    // 서버 이벤트
    this.event = event;

    // distributor와 연결 상태
    this.isConnectedDistributor = false;

    this.initServer();
  }

  initServer() {
    this.server = net.createServer((socket) => {
      this.event.onConnection(socket);

      socket.on('data', (data) => {
        this.event.onData(socket, data);
      });
      socket.on('end', () => {
        this.event.onEnd(socket);
      });
      socket.on('error', (err) => {
        this.event.onError(socket, err);
      });
    });

    this.server.listen(this.context.port, () => {
      logger.info(`SERVER ON - ${this.context.host} : ${this.context.port}`);
    });
  }

  // Distributor 접속
  connectToDistributor(host, port, onNoti, servicePackets = []) {
    const packet = {
      context: this.context,
      packets: servicePackets,
    };

    this.clientDistributor = new TcpClient(
      host,
      port,
      (options) => {
        // Distributor 접속 이벤트
        this.isConnectedDistributor = true;
        // distributor와 통신은 별로 할 일 없으니 간단하게 stringify로 통신
        this.clientDistributor.write(JSON.stringify(packet));
      },
      (options, data) => {
        // Distributor 데이터 수신 이벤트
        onNoti(data);
      },
      (options) => {
        // Distributor 접속종료 이벤트
        logger.info('Distributor와 연결 종료');
        this.isConnectedDistributor = false;
      },
      (options, err) => {
        // Distributor 통신 에러 이벤트
        err.message = 'Distributor와 통신 에러';
        handleErr(null, err);
        this.isConnectedDistributor = false;
      },
    );

    // 주기적으로 distributor에 재접속 시도
    setInterval(() => {
      if (this.isConnectedDistributor != true) {
        this.clientDistributor.connect();
      }
    }, 3000);
  }
}

export default TcpServer;
