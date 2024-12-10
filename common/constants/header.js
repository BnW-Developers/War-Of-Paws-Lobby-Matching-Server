export const PACKET_TYPE_LENGTH = 2;
export const PACKET_VERSION_LENGTH = 1;
export const PACKET_SEQUENCE = 4;
export const PACKET_PAYLOAD_LENGTH = 2;

export const TOKEN_LENGTH = 2;

// 서버 전용 헤더
export const PACKET_CLIENT_KEY_LENGTH = 2;

export const PACKET_TYPE = Object.freeze({
  // 에러
  ERROR_NOTIFICATION: 1,

  // 첫 인증
  AUTH_REQUEST: 2,
  AUTH_RESPONSE: 3,

  // 매칭
  MATCH_REQUEST: 50,
  MATCH_NOTIFICATION: 51,
  MATCH_CANCEL_REQUEST: 52,
});

export const PACKET_TYPE_REVERSED = Object.freeze(
  Object.fromEntries(Object.entries(PACKET_TYPE).map(([key, value]) => [value, key])),
);
