import { COMMON_CONFIG } from '../../../common/config/config.js';
import { LOBBY_HOST, LOBBY_PORT } from '../constants/env.js';
import {
  PACKET_PAYLOAD_LENGTH,
  PACKET_SEQUENCE,
  PACKET_TYPE_LENGTH,
  PACKET_VERSION_LENGTH,
} from '../constants/header.js';

const config = {
  ...COMMON_CONFIG,
  lobby: {
    host: LOBBY_HOST,
    port: LOBBY_PORT,
  },
  client: {
    version: '1.0.0',
  },
  packet: {
    typeLength: PACKET_TYPE_LENGTH,
    versionLength: PACKET_VERSION_LENGTH,
    sequence: PACKET_SEQUENCE,
    payloadLength: PACKET_PAYLOAD_LENGTH,
  },
};

export default config;
