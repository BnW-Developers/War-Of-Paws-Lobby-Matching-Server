import axios from 'axios';
import { PACKET_TYPE } from '../../../common/constants/header.js';
import { handleErr } from '../../../common/error/handlerErr.js';
import redisClient from '../../../common/redis/redisClient.js';
import logger from '../../../common/utils/logger/logger.js';
import { createServerPacket } from '../../../common/utils/packet/createPacket.js';
import config from '../config/matching.config.js';
import bcrypt from 'bcryptjs';

class MatchingSystem {
  #config = {
    SPECIES: {
      CAT: 'CAT_QUEUE',
      DOG: 'DOG_QUEUE',
    },
    LOCK_KEY: 'matching:lock',
    LOCK_TTL: 3000, // 3초
    MAX_WAIT_TIME: 5 * 60 * 1000, // 5분
    MATCH_INTERVAL: 500, // 500ms마다 매치 시도
    MATCH_QUEUE_LIMIT: 10, // 큐에서 처리할 최대 항목 수
  };

  constructor() {
    // 싱글턴
    if (MatchingSystem.instance) {
      return MatchingSystem.instance;
    }

    this.redis = redisClient;
    this.responseSocket = null;

    // 매칭 루프 초기화
    this.#initializeMatchingLoop();

    MatchingSystem.instance = this;
  }

  // 매칭 루프 초기화
  #initializeMatchingLoop() {
    // 주기적으로 매칭 시도
    this.matchingIntervalId = setInterval(
      () => this.#processMatches(),
      this.#config.MATCH_INTERVAL,
    );
  }

  // 로비서버 소켓 등록
  registerSocket(socket) {
    this.responseSocket = socket;
  }

  // 분산 락 획득 시도
  async #acquireLock() {
    const lockValue = Date.now().toString();
    const result = await this.redis.set(
      this.#config.LOCK_KEY,
      lockValue,
      'PX',
      this.#config.LOCK_TTL,
      'NX',
    );
    return result === 'OK' ? lockValue : null;
  }

  // 분산 락 해제
  async #releaseLock(lockValue) {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    await this.redis.eval(script, 1, this.#config.LOCK_KEY, lockValue);
  }

  // 매칭 프로세스
  async #processMatches() {
    let lockValue = null;
    try {
      // 락 획득 시도
      lockValue = await this.#acquireLock();
      if (!lockValue) {
        // 다른 서버가 현재 매칭 처리 중
        return;
      }

      // CAT 팀과 DOG 팀의 각각의 대기열에서 유저 검색
      const allQueues = await this.#getAllQueues();

      // 타임아웃 체크 및 처리
      const filteredQueues = await this.#checkTimeouts(allQueues);

      // 매칭 시도
      await this.#tryMatch(filteredQueues);
    } catch (error) {
      logger.error(`Match Processing Error ${error.message}`);
      handleErr(null, error);
    } finally {
      if (lockValue) await this.#releaseLock(lockValue);
    }
  }

  // 모든 종족의 대기얼 졍보 불러오기
  async #getAllQueues() {
    try {
      const queues = {};
      for (const [species, queueKey] of Object.entries(this.#config.SPECIES)) {
        const queue = await this.redis.zrange(
          queueKey,
          0,
          this.#config.MATCH_QUEUE_LIMIT - 1,
          'WITHSCORES',
        );
        queues[species] = this.#parseQueueData(queue);
      }
      return queues;
    } catch (error) {
      logger.error(`Queue Retrieval Error ${error.message}`);
      throw error;
    }
  }

  #parseQueueData(queue) {
    const parsed = [];
    for (let i = 0; i < queue.length; i += 2) {
      parsed.push({
        userId: queue[i],
        timestamp: Number(queue[i + 1]),
      });
    }
    return parsed;
  }

  // 타임아웃 체크
  async #checkTimeouts(queues) {
    const now = Date.now();
    const filteredQueues = {};

    for (const [species, users] of Object.entries(queues)) {
      filteredQueues[species] = [];

      for (const user of users) {
        if (now - user.timestamp < this.#config.MAX_WAIT_TIME) {
          // 타임아웃 되지 않은 유저는 새로운 큐에 삽입
          filteredQueues[species].push(user);
        } else {
          await this.#handleMatchTimeout(user.userId, species);
        }
      }
    }

    return filteredQueues;
  }

  // 타임아웃 된 유저는 삭제
  async #handleMatchTimeout(userId, species) {
    try {
      logger.info(`Match timeout for user { userId, species }`);
      await this.removeUser(userId, species);
    } catch (error) {
      logger.error(`Match Timeout Handling Error ${(userId, species, error.message)}`);
    }
  }

  async #tryMatch(allUsers) {
    const catUsers = allUsers['CAT'] || [];
    const dogUsers = allUsers['DOG'] || [];
    const minLength = Math.min(catUsers.length, dogUsers.length);

    if (minLength === 0) return;

    // 트랜잭션 시작
    const multi = this.redis.multi();
    const matchedPairs = [];

    for (let i = 0; i < minLength; i++) {
      const catUser = catUsers[i];
      const dogUser = dogUsers[i];

      multi.zrem(this.#config.SPECIES.CAT, catUser.userId);
      multi.zrem(this.#config.SPECIES.DOG, dogUser.userId);

      matchedPairs.push({ catUser, dogUser });
    }

    // 트랜잭션 실행
    const results = await multi.exec();

    for (let i = 0; i < matchedPairs.length; i++) {
      const catRemoved = results[i * 2][1];
      const dogRemoved = results[i * 2 + 1][1];

      if (catRemoved && dogRemoved) {
        const { catUser, dogUser } = matchedPairs[i];
        await this.#handleMatchComplete(catUser.userId, dogUser.userId);
      }
    }
  }

  async #handleMatchComplete(user1Id, user2Id) {
    try {
      const sessionKeys = [`user:session:${user1Id}`, `user:session:${user2Id}`];

      const [user1Session, user2Session] = await Promise.all(
        sessionKeys.map((key) => this.redis.hgetall(key)),
      );

      if (!user1Session || !user2Session) {
        throw new Error('매칭된 유저를 찾을 수 없습니다.');
      }

      // 매칭 완료 후 헬스체크 서버로 port 요청
      const gameServerPort = await this.#requestHealthcheckServer(user1Id, user2Id);

      // 테스트용 임시 포트
      // const gameServerPort = 5051;

      logger.info(`Match complete user1: ${user1Id} vs user2: ${user2Id}`);

      const multi = this.redis.multi();
      sessionKeys.forEach((key) => {
        multi.hmset(key, {
          isMatchmaking: false,
          currentSpecies: '',
        });
      });
      await multi.exec();

      this.#matchNotification(gameServerPort, user1Id, user2Id);
    } catch (error) {
      logger.error(`Match Completion Error' ${(user1Id, user2Id, error.message)}`);
    }
  }

  #matchNotification(gameServerPort, user1Id, user2Id) {
    try {
      const createNotificationPacket = (userId, opponentId) =>
        createServerPacket(PACKET_TYPE.MATCH_NOTIFICATION, userId, {
          opponentId: opponentId,
          port: gameServerPort,
        });

      const packet1 = createNotificationPacket(user1Id, user2Id);
      const packet2 = createNotificationPacket(user2Id, user1Id);

      this.responseSocket.write(packet1);
      this.responseSocket.write(packet2);

      logger.info('Match notifications sent', { user1Id, user2Id });
    } catch (error) {
      logger.error('Match Notification Error', {
        user1Id,
        user2Id,
        error: error.message,
      });
    }
  }

  async #requestHealthcheckServer(user1Id, user2Id) {
    try {
      // salt 값을 숫자로 변환
      let saltRounds = config.auth.salt;

      // 문자열 타입인 경우 숫자로 변환
      if (typeof saltRounds === 'string') {
        saltRounds = parseInt(saltRounds, 10);
      }

      // 변환 후 유효한 숫자인지 확인
      if (isNaN(saltRounds) || saltRounds <= 0) {
        throw new Error(`Invalid salt rounds value: ${config.auth.salt}`);
      }

      // apikey 암호화
      const apikey = await bcrypt.hash(config.auth.apiKey, saltRounds);
      const response = await axios.post(
        `http://${config.healthcheck.host}:${config.healthcheck.port}${config.healthcheck.uri}`,
        {
          users: [
            { userId: user1Id, species: 'cat' },
            { userId: user2Id, species: 'dog' },
          ],
        },
        {
          headers: {
            authorization: apikey,
          },
        },
      );

      const gameServerPort = response.data.svrPort;

      logger.info(`Game Server port recived: ${gameServerPort}`);

      return gameServerPort;
    } catch (err) {
      logger.error(`Game Server Request Error: ${err}`);
    }
  }

  // 종족에 맞는 매칭 큐에 유저 등록
  async addQueue(userId, species) {
    try {
      const sessionKey = `user:session:${userId}`;
      const upperSpecies = species.toUpperCase();

      // 유저 매치매이킹 상태 업데이트 (true)
      await this.redis.hmset(sessionKey, {
        isMatchmaking: true,
        currentSpecies: upperSpecies,
      });

      const queueKey = this.#config.SPECIES[upperSpecies];
      // sorted set에 유저 저장. score: timestamp, value: userId
      await this.redis.zadd(queueKey, Date.now(), userId);

      logger.info(`User added to queue ${(userId, upperSpecies)}`);
      return { success: true, message: 'Added to queue' };
    } catch (error) {
      logger.error('Add Queue Error', {
        userId,
        species,
        error: error.message,
      });
      handleErr(null, error);
    }
  }

  // 매칭 큐에서 유저 삭제
  async removeUser(userId, species) {
    try {
      const sessionKey = `user:session:${userId}`;

      await this.redis.hmset(sessionKey, {
        isMatchmaking: false,
        currentSpecies: '',
      });

      const queueKey = this.#config.SPECIES[species];
      await this.redis.zrem(queueKey, userId);

      logger.info(`User removed from queue ${(userId, species)}`);
    } catch (error) {
      logger.error(`Remove User Error ${(userId, species, error.message)}`);
    }
  }
}

export default new MatchingSystem();
