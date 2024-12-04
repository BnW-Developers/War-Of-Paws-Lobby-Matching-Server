import { handleErr } from '../../../../common/error/handlerErr.js';
import redisClient from '../../../../common/redis/redisClient.js';
import logger from '../../../../common/utils/logger/logger.js';
import { createServerPacket } from '../../../../common/utils/packet/createPacket.js';
import matchingSystem from '../../matchingQueue/matchingSystem.js';

const matchCancelRequest = async (socket, clientKey, payload) => {
  try {
    logger.info(`match cancel request from: ${clientKey}`);

    // Redis에서 사용자 세션 확인
    const sessionKey = `user:session:${clientKey}`;
    const userSession = await redisClient.hgetall(sessionKey);

    if (!userSession) {
      throw new Error('Match request error: 유저를 찾을 수 없습니다.');
    }

    // 매칭 중인 경우에만 큐에서 제거
    if (userSession.isMatchmaking === 'true') {
      await matchingSystem.removeUser(clientKey, userSession.currentSpecies);
      logger.info(`match Cancel request for socket: ${clientKey}`);

      const packet = createServerPacket(9, clientKey, { opponentId: 'match cancel' });
      socket.write(packet);
    } else {
      console.warn(`client ${clientKey}: 매칭 중이 아닙니다.`);
    }
  } catch (err) {
    handleErr(socket, err);
  }
};

export default matchCancelRequest;
