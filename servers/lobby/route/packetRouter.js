import logger from '../../../common/utils/logger/logger.js';
import { createServerPacket } from '../../../common/utils/packet/createPacket.js';

class PacketRouter {
  /**
   * 마이크로서비스 등록 메서드
   * @param {Object} packetRoutingMap - 패킷 라우팅 맵
   * @param {Object} node - 마이크로서비스 노드 정보
   * @param {TcpClient} client - 해당 서비스의 TCP 클라이언트
   */
  static registerMicroservice(packetRoutingMap, node, client) {
    const { servicePackets } = node;

    if (!servicePackets || servicePackets.length === 0) {
      logger.warn(`No service packets for node: ${node.info.name}`);
      return;
    }

    const serviceInfo = {
      name: node.info.name,
      client: client,
      lastUsed: 0,
    };

    // 각 패킷 타입에 서비스 정보 등록
    servicePackets.forEach((packetType) => {
      if (!packetRoutingMap[packetType]) {
        packetRoutingMap[packetType] = [];
      }
      packetRoutingMap[packetType].push(serviceInfo);
    });
  }
  /**
   * 패킷 라우팅 메서드
   * @param {Object} packetRoutingMap - 패킷 라우팅 맵
   * @param {net.Socket} socket - 클라이언트 소켓
   * @param {Object} packet - 수신된 패킷
   * @returns {boolean} 라우팅 성공 여부
   */
  static routePacket(packetRoutingMap, socket, packet) {
    console.log('packet: ', packet);
    if (!packet || !packet.packetType) {
      logger.error('Invalid packet structure');
      return false;
    }

    const servicesForPacket = packetRoutingMap[packet.packetType];

    if (!servicesForPacket || servicesForPacket.length === 0) {
      logger.warn(`No service registered for packet packetType: ${packet.packetType}`);
      return false;
    }

    // 라운드 로빈 방식으로 서비스 선택
    const selectedService = this.selectServiceRoundRobin(servicesForPacket);

    if (selectedService) {
      try {
        // 서버로 보내는 패킷 생성
        const key = `${socket.remoteAdderss}:${socket.remotePort}`;
        const serverPacket = createServerPacket(packet.packetType, key, packet.payload);

        // 패킷을 선택된 마이크로서비스로 전달
        selectedService.client.write(serverPacket);
        return true;
      } catch (error) {
        console.error(`Error routing packet to service ${selectedService.name}:`, error);
        return false;
      }
    }

    return false;
  }

  /**
   * 라운드 로빈 방식의 서비스 선택 메서드
   * @param {Array} services - 패킷 타입에 대해 등록된 서비스들
   * @returns {Object} 선택된 서비스
   */
  static selectServiceRoundRobin(services) {
    const now = Date.now();

    const availableServices = services.filter(
      (service) => now - service.lastUsed > 1000, // 1초 대기 시간
    );

    if (availableServices.length === 0) {
      // 모든 서비스가 사용 중이면 첫 번째 서비스 선택
      return services[0];
    }

    // 가장 오래 사용되지 않은 서비스 선택
    const selectedService = availableServices.reduce((prev, current) =>
      prev.lastUsed < current.lastUsed ? prev : current,
    );

    // 선택된 서비스의 마지막 사용 시간 업데이트
    selectedService.lastUsed = now;

    return selectedService;
  }

  /**
   * 특정 패킷 타입에 대한 등록된 서비스 목록 조회
   * @param {Object} packetRoutingMap - 패킷 라우팅 맵
   * @param {number} packetType - 조회할 패킷 타입
   * @returns {Array} 해당 패킷 타입의 서비스 목록
   */
  static getServicesForPacketType(packetRoutingMap, packetType) {
    return packetRoutingMap[packetType] || [];
  }

  /**
   * 특정 서비스 제거
   * @param {Object} packetRoutingMap - 패킷 라우팅 맵
   * @param {string} serviceName - 제거할 서비스 이름
   */
  static removeMicroservice(packetRoutingMap, serviceName) {
    for (const packetType in packetRoutingMap) {
      packetRoutingMap[packetType] = packetRoutingMap[packetType].filter(
        (service) => service.name !== serviceName,
      );
    }
  }
}

export default PacketRouter;
