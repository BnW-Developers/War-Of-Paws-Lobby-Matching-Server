import config from '../../config/lobby.config.js';

export const parsePacket = (socket) => {
  // 클라이언트로 부터 받은 패킷 파싱

  let offset = 0;
  // packetType
  if (socket.buffer.length < offset + config.packet.typeLength) return null;
  const packetType = socket.buffer.readUInt16BE(offset);
  offset += config.packet.typeLength;

  // versionLength
  if (socket.buffer.length < offset + config.packet.versionLength) return null;
  const versionLength = socket.buffer.readUInt8(offset);
  offset += config.packet.versionLength;

  // version
  if (socket.buffer.length < offset + versionLength) return null;
  const version = socket.buffer.subarray(offset, offset + versionLength).toString();
  offset += versionLength;

  // sequence
  if (socket.buffer.length < offset + config.packet.sequence) return null;
  const sequence = socket.buffer.readUInt32BE(offset);
  offset += config.packet.sequence;

  // payloadLength
  if (socket.buffer.length < offset + config.packet.payloadLength) return null;
  const payloadLength = socket.buffer.readUInt16BE(offset);
  offset += config.packet.payloadLength;

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
