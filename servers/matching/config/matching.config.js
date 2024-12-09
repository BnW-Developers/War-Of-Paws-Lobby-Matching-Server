import { COMMON_CONFIG } from '../../../common/config/config.js';
import { PACKET_TYPE } from '../../../common/constants/header.js';
import {
  API_KEY,
  HEALTHCHECK_HOST,
  HEALTHCHECK_PORT,
  HEALTHCHECK_URI,
  MATCHING_HOST,
  MATCHING_PORT,
  SALT,
} from '../constants/env.js';

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
  healthcheck: {
    host: HEALTHCHECK_HOST,
    port: HEALTHCHECK_PORT,
    uri: HEALTHCHECK_URI,
  },
  auth: {
    apiKey: API_KEY,
    salt: SALT,
  },
};

export default config;
