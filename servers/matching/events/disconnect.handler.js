import redisClient from '../../../common/redis/redisClient.js';
import logger from '../../../common/utils/logger/logger.js';

class MatchingDisconnectHandler {
  constructor() {
    this.redisClient = redisClient; // Redis 클라이언트
    this.initializeSubscription();
  }

  // Redis Pub/Sub 구독 초기화
  initializeSubscription() {
    const subscriber = this.redisClient.duplicate();
    subscriber.subscribe('user:disconnect');

    subscriber.on('message', (channel, message) => {
      if (channel !== 'user:disconnect') {
        logger.warn(`알 수 없는 채널 메시지 수신: ${channel}`);
        return;
      }

      try {
        if (!message) {
          logger.warn('수신한 메시지가 null입니다.');
          return;
        }

        const eventData = JSON.parse(message);

        // 메시지 검증
        if (!eventData || !eventData.userId || !eventData.timestamp) {
          logger.warn(`수신한 메시지의 형식이 잘못되었습니다: ${message}`);
          return;
        }

        this.handleUserDisconnect(eventData);
      } catch (error) {
        logger.error('Disconnect 이벤트 파싱 오류', error);
      }
    });
  }

  // 유저 접속 종료 이벤트 처리
  async handleUserDisconnect(eventData) {
    const { userId, timestamp } = eventData;

    // 이벤트 중복 처리 방지를 위한 분산 락
    const lockKey = `disconnect:matching:lock:${userId}`;
    const lockTTL = 5000; // 5초
    let lockValue = null;
    try {
      // 분산 락 획득 시도
      lockValue = await this.acquireLock(lockKey, lockTTL);

      if (!lockValue) {
        logger.warn(`이미 처리 중인 disconnection 이벤트: ${userId}`);
        return;
      }

      // 유저의 매칭 상태 확인
      const userSession = await this.redisClient.hgetall(`user:session:${userId}`);

      // 매칭 중인 경우에만 취소 로직 실행
      if (userSession.isMatchmaking === 'true') {
        await this.cancelMatchmaking(userId, userSession.currentSpecies);
      }
    } catch (error) {
      logger.error(`Disconnect 처리 중 오류: ${userId}`, error);
    } finally {
      // 락 해제
      await this.releaseLock(lockKey, lockValue);
    }
  }

  // 분산 락 획득
  async acquireLock(lockKey, ttl) {
    const lockValue = Date.now().toString();
    const result = await this.redisClient.set(lockKey, lockValue, 'PX', ttl, 'NX');
    if (result === 'OK') {
      return lockValue;
    }
    return null;
  }

  // 분산 락 해제
  async releaseLock(lockKey, lockValue) {
    const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
    `;
    await this.redisClient.eval(script, 1, lockKey, lockValue);
  }

  // 매칭 취소 로직
  async cancelMatchmaking(userId, species) {
    try {
      // 세션 정보 초기화
      const sessionKey = `user:session:${userId}`;
      await this.redisClient.hmset(sessionKey, {
        isMatchmaking: false,
        currentSpecies: '',
      });

      // 매칭 큐에서 유저 제거
      const queueKey = this.getQueueKeyBySpecies(species);
      await this.redisClient.zrem(queueKey, userId);

      logger.info(`매칭 취소 완료: ${userId}, 종족: ${species}`);
    } catch (error) {
      logger.error(`매칭 취소 중 오류: ${userId}`, error);
    }
  }

  // 종족에 따른 큐 키 반환
  getQueueKeyBySpecies(species) {
    const SPECIES_QUEUES = {
      CAT: 'CAT_QUEUE',
      DOG: 'DOG_QUEUE',
    };
    return SPECIES_QUEUES[species.toUpperCase()] || null;
  }
}

export default MatchingDisconnectHandler;
