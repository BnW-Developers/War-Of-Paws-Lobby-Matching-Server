// 접속 노드 혹은 특정 소켓에 접속 노드 정보 전파
export const sendConnectionInfo = (socket, map) => {
  const packet = {
    microservices: [],
  };

  for (const n in map) {
    const data = {
      info: map[n].info,
      servicePackets: map[n].servicePackets,
    };
    packet.microservices.push(data);
  }

  if (socket) {
    // 소켓이 있는 경우 해당 소켓에만 전송
    socket.write(JSON.stringify(packet));
    console.log('JSON.stringify(packet): ', JSON.stringify(packet));
  } else {
    for (const n in map) {
      // 소켓이 없는 경우 전체 전송
      map[n].socket.write(JSON.stringify(packet));
      console.log('JSON.stringify(packet): ', JSON.stringify(packet));
    }
  }
};
