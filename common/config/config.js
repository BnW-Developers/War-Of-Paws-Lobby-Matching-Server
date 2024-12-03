import {
  DB1_HOST,
  DB1_NAME,
  DB1_PASSWORD,
  DB1_PORT,
  DB1_USER,
  DB2_HOST,
  DB2_NAME,
  DB2_PASSWORD,
  DB2_PORT,
  DB2_USER,
  DISTRIBUTOR_HOST,
  DISTRIBUTOR_PORT,
  REDIS_DATABASE,
  REDIS_HOST,
  REDIS_PASSWORD,
  REDIS_PORT,
} from '../constants/env.js';
import {
  PACKET_CLIENT_KEY_LENGTH,
  PACKET_PAYLOAD_LENGTH,
  PACKET_SEQUENCE,
  PACKET_TYPE_LENGTH,
  PACKET_VERSION_LENGTH,
} from '../constants/header.js';

export const COMMON_CONFIG = {
  distributor: {
    host: DISTRIBUTOR_HOST,
    port: DISTRIBUTOR_PORT,
  },
  client: {
    version: '1.0.1',
  },
  packet: {
    client: {
      typeLength: PACKET_TYPE_LENGTH,
      versionLength: PACKET_VERSION_LENGTH,
      sequence: PACKET_SEQUENCE,
      payloadLength: PACKET_PAYLOAD_LENGTH,
    },
    server: {
      typeLength: PACKET_TYPE_LENGTH,
      clientKeyLength: PACKET_CLIENT_KEY_LENGTH,
      payloadLength: PACKET_PAYLOAD_LENGTH,
    },
  },
  database: {
    USER_DB: {
      name: DB1_NAME,
      user: DB1_USER,
      password: DB1_PASSWORD,
      host: DB1_HOST,
      port: DB1_PORT,
    },
    GAME_DB: {
      name: DB2_NAME,
      user: DB2_USER,
      password: DB2_PASSWORD,
      host: DB2_HOST,
      port: DB2_PORT,
    },
  },
  redis: {
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
    database: REDIS_DATABASE,
  },
};
