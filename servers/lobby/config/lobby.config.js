import { COMMON_CONFIG } from '../../../common/config/config.js';
import { LOBBY_HOST, LOBBY_PORT } from '../constants/env.js';

const config = {
  ...COMMON_CONFIG,
  lobby: {
    host: LOBBY_HOST,
    port: LOBBY_PORT,
  },
  client: {
    version: '1.0.0',
  },
};

export default config;
