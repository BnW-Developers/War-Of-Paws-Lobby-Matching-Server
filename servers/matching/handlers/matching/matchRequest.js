import { handleErr } from '../../../../common/error/handlerErr.js';
import redisClient from '../../../../common/redis/redisClient.js';
import logger from '../../../../common/utils/logger/logger.js';
import { createServerPacket } from '../../../../common/utils/packet/createPacket.js';
import matchingSystem from '../../matchingQueue/matchingSystem.js';

const matchRequest = async (socket, clientKey, payload) => {
  try {
    const { species } = payload;

    // Redis에서 사용자 세션 확인
    const sessionKey = `user:session:${clientKey}`;
    const userSession = await redisClient.hgetall(sessionKey);

    if (!userSession) {
      throw new Error('Match request error: 유저를 찾을 수 없습니다.');
    }

    logger.info(`match request id: ${clientKey}`);

    // 유저가 매칭을 돌리고 있는데 또 매칭 요청을 보냈다면
    if (userSession.isMatchmaking === 'true') {
      // 그냥 다음 매칭 요청은 무시
      return;
    }

    const result = await matchingSystem.addQueue(clientKey, species);

    if (result.success) {
      logger.info(`user ${clientKey} add queue result: ${result.message}`);
    } else {
      throw new Error(`user ${clientKey} add queue result: failed`);
    }

    // const packet = createServerPacket(9, clientKey, { opponentId: 'tryMatch' });
    // socket.write(packet);
  } catch (err) {
    handleErr(socket, err);
  }
};

export default matchRequest;
