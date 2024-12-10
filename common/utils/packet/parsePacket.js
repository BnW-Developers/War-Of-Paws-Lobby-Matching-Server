import { COMMON_CONFIG as config } from '../../config/config.js';
import { PACKET_TYPE_REVERSED } from '../../constants/header.js';
import { GamePacket } from '../../protobuf/loadProto.js';
import { snakeToCamel } from './../formatters/snakeToCamel.js';

export const parseC2LobbyPacket = (socket) => {
  // 클라이언트로 부터 받은 패킷 파싱

  let offset = 0;
  // packetType
  if (socket.buffer.length < offset + config.packet.client.typeLength) return null;
  const packetType = socket.buffer.readUInt16BE(offset);
  offset += config.packet.client.typeLength;

  // versionLength
  if (socket.buffer.length < offset + config.packet.client.versionLength) return null;
  const versionLength = socket.buffer.readUInt8(offset);
  offset += config.packet.client.versionLength;

  // version
  if (socket.buffer.length < offset + versionLength) return null;
  const version = socket.buffer.subarray(offset, offset + versionLength).toString();
  offset += versionLength;

  // sequence
  if (socket.buffer.length < offset + config.packet.client.sequence) return null;
  const sequence = socket.buffer.readUInt32BE(offset);
  offset += config.packet.client.sequence;

  // payloadLength
  if (socket.buffer.length < offset + config.packet.client.payloadLength) return null;
  const payloadLength = socket.buffer.readUInt16BE(offset);
  offset += config.packet.client.payloadLength;

  // payload
  if (socket.buffer.length < offset + payloadLength) return null;
  const payload = socket.buffer.subarray(offset, offset + payloadLength);
  offset += payloadLength;

  // 남은 버퍼를 업데이트
  socket.buffer = socket.buffer.subarray(offset);

  // 실질적 사용할 것만 리턴
  return {
    packetType,
    //version,
    //sequence,
    payload,
  };
};

// 다른 서버로 부터 받은 패킷 파싱
export const parseServerPacket = (socket) => {
  let offset = 0;

  // packetType
  if (socket.buffer.length < offset + config.packet.server.typeLength) return null;
  const packetType = socket.buffer.readUInt16BE(offset);
  offset += config.packet.server.typeLength;

  // client key length
  if (socket.buffer.length < offset + config.packet.server.clientKeyLength) return null;
  const clientKeyLength = socket.buffer.readUInt16BE(offset);
  offset += config.packet.server.clientKeyLength;

  // client key
  if (socket.buffer.length < offset + clientKeyLength) return null;
  const clientKey = socket.buffer.subarray(offset, offset + clientKeyLength).toString('utf8');
  offset += clientKeyLength;

  // payload length
  if (socket.buffer.length < offset + config.packet.server.payloadLength) return null;
  const payloadLength = socket.buffer.readUInt16BE(offset);
  offset += config.packet.server.payloadLength;

  // payload
  if (socket.buffer.length < offset + payloadLength) return null;
  const payload = socket.buffer.subarray(offset, offset + payloadLength);
  offset += payloadLength;

  // 남은 버퍼를 업데이트
  socket.buffer = socket.buffer.subarray(offset);

  return {
    packetType,
    clientKey,
    payload,
  };
};

export const getDecodedPayload = (packetType, payload) => {
  const payloadName = snakeToCamel(PACKET_TYPE_REVERSED[packetType]);
  return { ...GamePacket.decode(payload)[payloadName] };
};
