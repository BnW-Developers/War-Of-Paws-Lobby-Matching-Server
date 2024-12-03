import { COMMON_CONFIG } from '../../../common/config/config.js';
import { PACKET_TYPE } from '../../../common/constants/header.js';
import { MATCHING_HOST, MATCHING_PORT } from '../constants/env.js';

const config = {
  ...COMMON_CONFIG,
  matching: {
    host: MATCHING_HOST,
    port: MATCHING_PORT,
  },
  services: [
    PACKET_TYPE.MATCH_REQUEST,
    PACKET_TYPE.MATCH_NOTIFICATION,
    PACKET_TYPE.MATCH_CANCEL_REQUEST,
  ],
};

export default config;
