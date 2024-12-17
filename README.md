# 🐾 War Of Paws Lobby, Matching Server

## 📝 개요
![Lobby](https://github.com/user-attachments/assets/c60942c6-49e0-4638-aea4-0ae755af6585)

[냥멍대전](https://github.com/BnW-Developers/War-Of-Paws-Game-Server)의 로비와 매칭을 처리하는 독립적인 서버. <br>
클라이언트는 이 서버를 통해 매칭 관련 기능을 수행.

- 🕹️ [냥멍대전 게임서버](https://github.com/BnW-Developers/War-Of-Paws-Game-Server)  
- 🔑 [냥멍대전 인증서버](https://github.com/BnW-Developers/War-Of-Paws-Auth-Server)  
- 🎯 [로비-매칭서버](https://github.com/BnW-Developers/War-Of-Paws-Lobby-Matching-Server)  
- 💊 [Nginx-헬퍼 서버](https://github.com/BnW-Developers/Nginx-Helper-Server)  
- ✅ [헬스체크 서버](https://github.com/BnW-Developers/War-Of-Paws-Health-Server)  

---

## 로비 서버 플로우

![Lobby-서버-플로우](https://github.com/user-attachments/assets/0d622e2c-a688-4d29-8b75-53bdda129a30)

---

## 🚀 주요 기능
### 🏢 로비 서버
- 클라이언트와 TCP 연결을 유지하며 안정적인 통신 관리
- 클라이언트의 요청을 확인하고 `packetType`에 따라 적합한 마이크로서비스로 **요청을 라우팅**
- 마이크로서비스에서 전달받은 응답이나 알림을 해당 클라이언트에게 전달

### 🔄 매칭 서버
- 1:1 매칭 요청을 처리하며, **서로 다른 종족 간 매칭** 규칙을 적용
- 매칭 요청 클라이언트를 `Redis` 매칭 큐에 저장하고 **요청 순서에 따라 공정하게 매칭**
- 매칭 성사 시, 헬스체크 서버로 매칭된 유저들의 ID를 전송하고, 포트를 전달받아 클라이언트에게 안내
- `Redis`의 분산락 기능을 활용하여 동일한 클라이언트가 **중복 매칭되지 않도록** 처리

### 📦 배포 자동화 및 Docker 활용
- **GitHub Actions**를 활용하여 코드 변경 이벤트에 따라 자동으로 서버에 배포하는 CI/CD 파이프라인 구성
  - `dev` 브랜치에 Push 또는 Pull Request 이벤트가 발생하면 빌드 및 배포 작업이 자동으로 실행
  - Docker 이미지를 빌드하고 Docker Hub에 푸시한 뒤, GCP 서버로 이미지를 배포

- **Docker**와 **Docker Compose**를 사용하여 배포 환경 관리  
  - 각 마이크로서비스를 컨테이너화하여 독립적으로 실행 및 관리  
  - Docker Compose를 통해 네트워크 설정과 환경 변수를 통합적으로 관리  


--- 

## 📬 공통 패킷 구조

로비 서버에서 다른 마이크로서비스로 요청을 전달할 때 사용하는 공통 패킷 구조

| **필드명**        | **타입**      | **설명**                      |
|--------------------|---------------|--------------------------------|
| `packetType`       | `ushort`      | 패킷 타입 (2바이트)            |
| `clientKeyLength`  | `ushort`      | 클라이언트 키 길이 (2바이트)   |
| `clientKey`        | `string`      | 클라이언트 키 (문자열)         |
| `payloadLength`    | `ushort`      | 데이터 길이 (2바이트)          |
| `payload`          | `bytes`       | 실제 데이터                    |


---

## 🛠️ 기술 스택
### 🖥️ 기술
<img src="https://shields.io/badge/JavaScript-F7DF1E?logo=JavaScript&logoColor=000&style=flat-square" style="height : 25px; margin-left : 10px; margin-right : 10px;"/> 
<img src="https://shields.io/badge/Node.js-339933?logo=Node.js&logoColor=fff&style=flat-square" style="height : 25px; margin-left : 10px; margin-right : 10px;"/> 
<img src="https://shields.io/badge/Axios-5A29E4?logo=Axios&logoColor=fff&style=flat-square" style="height : 25px; margin-left : 10px; margin-right : 10px;"/> 

### 🔐 인증
<img src="https://shields.io/badge/JWT-000000?logo=JSONWebTokens&logoColor=fff&style=flat-square" style="height : 25px; margin-left : 10px; margin-right : 10px;"/> 

### 🗂️ 데이터베이스
<img src="https://shields.io/badge/Redis-DC382D?logo=Redis&logoColor=fff&style=flat-square" style="height : 25px; margin-left : 10px; margin-right : 10px;"/> 

### 🚀 DevOps
<img src="https://shields.io/badge/Docker-2496ED?logo=Docker&logoColor=fff&style=flat-square" style="height : 25px; margin-left : 10px; margin-right : 10px;"/> 
<img src="https://shields.io/badge/Docker_Compose-2496ED?logo=Docker&logoColor=fff&style=flat-square" style="height : 25px; margin-left : 10px; margin-right : 10px;"/> 
<img src="https://shields.io/badge/GitHub_Actions-2088FF?logo=GitHubActions&logoColor=fff&style=flat-square" style="height : 25px; margin-left : 10px; margin-right : 10px;"/> 

### 🌍 배포 환경
<img src="https://shields.io/badge/GCP-4285F4?logo=GoogleCloud&logoColor=fff&style=flat-square" style="height : 25px; margin-left : 10px; margin-right : 10px;"/> 
