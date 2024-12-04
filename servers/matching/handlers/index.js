import { PACKET_TYPE } from '../../../common/constants/header.js';
import matchCancelRequest from './matching/matchCancelRequest.js';
import matchRequest from './matching/matchRequest.js';

export const handlers = {
  [PACKET_TYPE.MATCH_REQUEST]: {
    handler: matchRequest,
  },
  [PACKET_TYPE.MATCH_CANCEL_REQUEST]: {
    handler: matchCancelRequest,
  },
};

export const getHandlerByPacketType = (packetType) => {
  if (!handlers[packetType]) {
    throw Error();
  }

  return handlers[packetType].handler;
};
