import { COMMON_CONFIG as config } from '../../config/config.js';
import { PACKET_TYPE_REVERSED } from '../../constants/header.js';
import { GamePacket } from '../../protobuf/loadProto.js';
import { snakeToCamel } from '../formatters/snakeToCamel.js';

export const createL2CPacket = (Type, seq, payload) => {
  if (!Buffer.isBuffer(payload)) {
    payload = encodePayloadToBuffer(Type, payload);
  }

  const packetType = Buffer.alloc(config.packet.client.typeLength);
  packetType.writeUInt16BE(Type, 0);

  const versionLength = Buffer.alloc(config.packet.client.versionLength);
  const vLen = config.client.version.length;
  versionLength.writeUInt8(vLen, 0);

  const version = Buffer.alloc(vLen);
  Buffer.from(config.client.version).copy(version);

  const sequence = Buffer.alloc(config.packet.client.sequence);
  sequence.writeUInt32BE(seq, 0); // 현재는 시퀀스 관리 없이 증가

  const payloadLength = Buffer.alloc(config.packet.client.payloadLength);
  payloadLength.writeUInt16BE(payload.length, 0);

  return Buffer.concat([packetType, versionLength, version, sequence, payloadLength, payload]);
};

/**
 * 서버-서버로 패킷을 보낼 때 사용할 패킷 생성
 * @param {number} packetType - 패킷 타입
 * @param {string} clientKey - 클라이언트 키
 * @param {Buffer} payloadBuffer - 서버로 전달할 페이로드 버퍼
 */
export const createServerPacket = (packetType, clientKey, payloadBuffer) => {
  if (!Buffer.isBuffer(payloadBuffer)) {
    payloadBuffer = encodePayloadToBuffer(packetType, payloadBuffer);
  }

  const packetTypeBuffer = Buffer.alloc(config.packet.server.typeLength);
  packetTypeBuffer.writeUInt16BE(packetType, 0);

  const clientKeyLengthBuffer = Buffer.alloc(config.packet.server.clientKeyLength);
  clientKeyLengthBuffer.writeUInt16BE(clientKey.length, 0);

  const clientKeyBuffer = Buffer.from(clientKey);

  const payloadLengthBuffer = Buffer.alloc(config.packet.server.payloadLength);
  payloadLengthBuffer.writeUInt16BE(payloadBuffer.length);

  return Buffer.concat([
    packetTypeBuffer,
    clientKeyLengthBuffer,
    clientKeyBuffer,
    payloadLengthBuffer,
    payloadBuffer,
  ]);
};

export const encodePayloadToBuffer = (packetType, payload) => {
  const typeName = PACKET_TYPE_REVERSED[packetType];
  const camel = snakeToCamel(typeName);
  const response = {
    [camel]: payload,
  };

  return GamePacket.encode(response).finish();
};
