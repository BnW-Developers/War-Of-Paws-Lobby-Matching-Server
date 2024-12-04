import { handleErr } from '../../../../common/error/handlerErr.js';
import logger from '../../../../common/utils/logger/logger.js';

const matchCancelRequest = async (socket, clientKey, payload) => {
  try {
    logger.info(`match cancel request from: ${clientKey}`);
    // const user = userSessionManager.getUserBySocket(socket);
    // if (!user) {
    //   throw new Error('유저를 찾을 수 없습니다');
    // }
    // matchingSystem.removeUser(user.getUserId(), user.getCurrentSpecies());
    // logger.info(`match Cancel request id: ${user.getUserId()}`);
  } catch (err) {
    handleErr(socket, err);
  }
};

export default matchCancelRequest;
