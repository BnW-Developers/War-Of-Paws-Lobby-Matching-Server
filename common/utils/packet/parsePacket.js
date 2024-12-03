import { COMMON_CONFIG as config } from '../../config/config.js';

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
  if (socket.buffer.length < offset + config.packet.typeLength) return null;
  const packetType = socket.buffer.readUInt16BE(offset);
  offset += config.packet.typeLength;

  // client key length
  if (socket.buffer.length < offset + 1) return null;
  const clientKeyLength = socket.buffer.readUInt16BE(offset);
  offset += 2;

  // client key
  if (socket.buffer.length < offset + clientKeyLength) return null;
  const clientKey = socket.buffer.subarray(offset, offset + clientKeyLength).toString('utf8');
  offset += clientKeyLength;

  // payload length
  if (socket.buffer.length < offset + config.packet.payloadLength) return null;
  const payloadLength = socket.buffer.readUInt16BE(offset);
  offset += config.packet.payloadLength;

  // payload
  if (socket.buffer.length < offset + payloadLength) return null;
  const payload = socket.buffer.subarray(offset, offset + payloadLength);

  return {
    packetType,
    clientKey,
    payload,
  };
};
