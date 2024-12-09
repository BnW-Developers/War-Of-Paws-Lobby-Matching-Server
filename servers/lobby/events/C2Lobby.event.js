import logger from '../../../common/utils/logger/logger.js';
import config from '../config/lobby.config.js';
import PacketRouter from '../route/packetRouter.js';
import {
  parseC2LobbyInitPacket,
  parseC2LobbyPacket,
} from '../../../common/utils/packet/parsePacket.js';
import jwt from 'jsonwebtoken';
import { SECRET_KEY } from '../constants/env.js';
import redisClient from './../../../common/redis/redisClient.js';

/**
 * 클라이언트(유저)가 게이트로 연결을 맺고 요청을 보낼 때를 정의
 * 유저가 보낸 패킷을 파싱하고 패킷타입 확인
 * 패킷 타입에 따라 적절한 마이크로서비스로 전달
 */
class C2LEventHandler {
  constructor(packetRoutingMap, connectSessionManager) {
    this.packetRoutingMap = packetRoutingMap;
    this.connectSessionManager = connectSessionManager;
  }

  async onConnection(socket) {
    try {
      const key = `${socket.remoteAddress}:${socket.remotePort}`;
      logger.info(`클라이언트 연결: ${key}`);

      // 초기 소켓 설정
      socket.buffer = Buffer.alloc(0);
      socket.isAuthenticated = false; // 인증 상태 플래그 추가

      // 일정 시간 내에 인증 완료되지 않으면 연결 종료
      socket.authTimeout = setTimeout(() => {
        if (!socket.isAuthenticated) {
          logger.warn(`인증 시간 초과: ${key}`);
          socket.end();
        }
      }, 10 * 1000); // 10초 타임아웃
    } catch (err) {
      console.error('Gate onConnection 오류', err);
      socket.end();
    }
  }

  async onData(socket, data) {
    try {
      console.log(`Lobby data from ${socket.remoteAddress}:${socket.remotePort}`);
      socket.buffer = Buffer.concat([socket.buffer, data]);

      // 최초 패킷에서 JWT 토큰 검증
      if (!socket.isAuthenticated) {
        // TODO: 첫 패킷에서 보낸 토큰 꺼내오기
        const token = parseC2LobbyInitPacket(socket);

        if (token) {
          try {
            // JWT 토큰 검증
            const decodedToken = jwt.verify(token, SECRET_KEY);
            const userId = decodedToken.userId;

            const sessionKey = `user:session:${userId}`;

            // Redis에서 유저 정보 확인
            const userInfo = await redisClient.exists(sessionKey);

            if (userInfo) {
              // 인증 성공 처리
              socket.isAuthenticated = true;
              socket.userId = decodedToken.userId;
              clearTimeout(socket.authTimeout);

              // connectSessionManager에 세션 추가
              this.connectSessionManager.addConnect(socket);

              logger.info(`클라이언트 인증 성공: ${socket.userId}`);
            }
          } catch (err) {
            logger.warn(`인증 실패: ${err.message}`);
            socket.end();
            return;
          }
        } else {
          // 토큰이 없는 경우 그냥 리턴
          return;
        }
      }

      // 인증된 후에 일반 패킷 처리
      const typeAndVersionLength =
        config.packet.client.typeLength + config.packet.client.versionLength;

      while (socket.buffer.length >= typeAndVersionLength) {
        const packet = parseC2LobbyPacket(socket);

        if (!packet) break;

        // 패킷 라우팅
        const routeSuccess = PacketRouter.routePacket(this.packetRoutingMap, socket, packet);

        if (!routeSuccess) {
          console.warn(`패킷 라우팅 실패: ${packet.packetType}`);
        }
      }
    } catch (err) {
      console.error('Gate onData 오류:', err);
    }
  }

  onEnd(socket) {
    try {
      if (socket.authTimeout) {
        clearTimeout(socket.authTimeout);
      }
      const key = socket.userId;
      const timestamp = Date.now();
      this.connectSessionManager.removeConnect(socket);

      // 유저 접속 종료 Pub
      redisClient.publish(
        'user:disconnect',
        JSON.stringify({
          userId: key,
          timestamp,
        }),
      );

      console.log(`클라이언트 연결 종료: ${socket.remoteAddress}:${socket.remotePort}`);
    } catch (err) {
      console.error('Gate onEnd error: ', err);
    }
  }

  onError(socket, err) {
    try {
      if (socket.authTimeout) {
        clearTimeout(socket.authTimeout);
      }
      const key = `${socket.remoteAddress}:${socket.remotePort}`;
      const timestamp = Date.now();
      this.connectSessionManager.removeConnect(socket);

      // 유저 접속 종료 Pub
      redisClient.publish(
        'user:disconnect',
        JSON.stringify({
          userId: key,
          timestamp,
        }),
      );

      console.error(`클라이언트 오류 발생: ${socket.remoteAddress}:${socket.remotePort}`, err);
    } catch (err) {
      console.error('Gate onError error: ', err);
    }
  }
}

export default C2LEventHandler;
