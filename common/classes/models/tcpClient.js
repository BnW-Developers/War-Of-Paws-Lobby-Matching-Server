import net from 'net';

// tcp client 클래스
class TcpClient {
  constructor(host, port, onCreate, onRead, onEnd, onError) {
    this.options = {
      host: host,
      port: port,
    };
    this.onCreate = onCreate;
    this.onRead = onRead;
    this.onEnd = onEnd;
    this.onError = onError;

    // 접속한 서버
    this.client = null;
  }

  // 서버에 연결하는 메서드
  connect() {
    this.client = net.connect(this.options, () => {
      if (this.onCreate) this.onCreate(this.options);
    });

    // 데이터 수신 처리
    this.client.on('data', (data) => {
      this.onRead(this.options, data);
    });

    // 연결 종료 처리
    this.client.on('end', () => {
      this.onEnd(this.options);
    });

    // 에러 처리
    this.client.on('error', (err) => {
      this.onError(this.options, err);
    });
  }

  // 서버로 데이터 전송
  write(packet) {
    this.client.write(packet);
  }
}

export default TcpClient;
