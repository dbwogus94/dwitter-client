import socket from 'socket.io-client';

/* ### socket사용시 알아야 할점
   - 소켓은 양방향성과 상태를 가진다.
   - 클라이언트와 서버는 한번의 연결(handshake)만으로 연결을 유지한다.
   - webSocket을 사용하는 클라이언트는 서버와 연결하기 위해 기본적으로 
     HTTP(TCP)프로토콜을 사용하여 연결을 요청한다.
   - 소켓은 항상 연결되어 있지만, 다양한 이유로 연결이 해제될 수 있고,
     연결이 해제 되었을때 빠르게 연결을 복구 할 수 있도록 설계 해야한다.
*/

export default class Socket {
  /**
   * ### Socket.io-client를 구현한 Soket 클래스 생성자
   * @param {string} baseURL
   * @param {function} getAccessToken
   */
  constructor(baseURL, getAccessToken) {
    this.io = socket(baseURL, {
      // ### socket.io에서 권고하는 auth 토큰을 안전하게 소켓에 적용하는 방법
      auth: cb => cb({ token: getAccessToken() }),
      transports: ['websocket'],
      /* socket.io는 websocket을 지원하지 않는 브라우저에서도 동작할 수 있도록 polling을 지원한다.
        - 하지만 간혹 버전에 따라 기본 요청을 polling를 사용하는 경우가 발생하여 서버에서 요청을 받지 못하는 오류가 발생한다.
        - 현재 dwitter는 websocket을 지원하는 브라우저를 대상으로만 사용한다. 
        - 때문에 명시적으로 websocket만 사용하도록 옵션을 설정하였다. */
    });
    /* ### auth token사용 주의!! 
      auth token을 요청 query에 담아서 보내는 실수가 종종있다.
      이 경우 개발자 모드에서 확인이 가능하기 때문에 보안상 위험하다.
       ex)
        soket(baseURL, {
          query: { token: this.getAccessToken() },
          transports: ['websocket'],
        });  
    */

    // ### 연결시 발생하는 이벤트
    this.io.on('connect', () => {
      console.log('[socket] connect');
    });

    // ### 연결 해지시 발생하는 이벤트
    this.io.on('disconnect', reason => {
      console.info(`[socket] disconnect - reason : ${reason}`);
      // 서버에서 연결을 끊은 경우
      if (reason === 'io server disconnect') {
        this.io.connect();
      }
      /*
        ### reason 종류
        1. io server disconnect : 서버에서 연결 해제
        2. io client disconnect : 클라이언트에서 .disconnect()또는 .close()를 사용하여 연결 해제
        3. ping itmeout : 서버가 pingInterval + pingTimeout범위 내에서 PING을 보내지 않았습니다.
        4. transport close : 지연으로 연결이 닫혔습니다.(ex: 서버 종료, 사용자 연결 끊김, 4G에서 WiFi로 변경 등)
        5. transport error : 연결에 오류가 발생 (ex: HTTP 긴 폴딩 주기 동안 서버가 종료됨)

        ** 1. 2.의 경우 다시 연결을 시도하지 않기 때문에 .connent()를 사용하여 재연결 해야한다.
          나머지의 3. 4. 5.는 재연결 시도를 자동으로 한다.
      */
    });

    // ### Socket 연결 오류가 발생하면 호출되는 이벤트
    this.io.on('connect_error', error => {
      console.error('[socket] error - ', error.message);

      // websocket error: 웹 소켓 서버가 없어 발생하는 에러 처리
      if (error.message === 'websocket error') {
        /* ### 소켓은 서버가 없어 연결 오류가 발생해도 지속적으로 연결을 시도한다.
           - 이러한 이유로 서버가 다시 구동하면 자동으로 연결된다. */
        //
        this.io.disconnect(); // == this.io.close();
        /* ### 지속적인 연결 요청을 멈추고 싶다면?
          - this.io.disconnect();코드를 사용하여 강제로 연결 요청을 종료한다.
          - 문제는 이 경우 서버가 다시 켜지더라도 연결을 시도하지 않는다. */
      }

      // 인증 관련 에러 발생시: 이 에러는 서버에서 구현한 에러이다.
      if (error.message.split(' ')[0] === 'Authentication') {
        this.io.disconnect();
        /* 
          ### 해당 로직은 유효한 토큰 없이 최초 로그인 화면을 호출하면 발생한다.
          - 이 상태는 서버 소켓에 연결을 시도하고 있을 뿐 연결된 상태는 아니다.

          ### 'Authentication'오류 메시지가 발생하는 이유?
          1. 서버에 http 프로토콜을 ws 프로토콜로 변경해달라는 요청이 발생
          2. ws로 프로토콜 변경 요청이 발생하면 서버는 소켓 연결을 시도한다.
          3. dwitter 서버는 소켓 연결을 시도할 때 auth 토큰을 검사한다.
          4. 이 때 토큰이 없거나 유효하지 않다면 'Authentication'에러를 내보낸다.

          ### 연결이 되지 않았는데 io.disconnect();을 통해 강제로 연결을 해지하는 이유는?
          서버 소켓의 미들웨어가 에러를 응답을 해도, 클라이언트 소켓은 연결 시도를 포기하지 않기 때문이다.
          - 서버 소켓의 미들웨어가 에러를 응답하면, 이후 클라이언트 소켓에 'disconnect'이벤트가 호출된다.
          - 그리고 'disconnect'이벤트에서 연결이 끊어진 이유로 'transport close'를 내보낸다.
          - 'transport close'가 발생하면 클라이언트 소켓은 일정 시간 이후 연결을 재시도 한다.
          
          ### this.io.disconnect();을 호출 이유 정리
          1. 서버소켓으로 연결시도시 토큰이 없으면 소켓 미들웨어에서 에러를 내보내도록 설계함
          2. 미들웨어에서 에러를 응답했기 때문에 최초 연결 시도는 실패함
          3. 클라이언트의 소켓에 'disconnect'이 호출되고 해지 사유로 'transport close'가 리턴됨
          4. 클라이언트 소켓은 연결 해지 이유를 네트워크 지연('transport close')으로 보고, 연결을 재시도함 
          5. 서버에 다시 연결을 요청해도 토큰이 유효하지 않기 때문에 다시 에러를 내보낸다.

          즉, 위 과정이 무한 반복되기 때문에 this.io.disconnect();를 호출하여 연결시도 자체를 끊는다.

          ### 소켓을 사용시 강제로 연결을 해제 했다면, 소켓이 필요한 로직전에 다시 연결되도록 설계 해야한다. 
          - 현재 클라이언트에서 소켓의 역할은 신규로 작성된 tweet을 모든 클라이언트에게 전파하기위해 사용된다.
          - 때문에 소켓을 사용하는 Tweets.jsx 컴포넌트가 생성될 때 onSync()함수를 통해 소켓을 재 연결 하도록 설계하였다.
          
          ** class Socket은 index.js에서 인스턴스화 된다. 
            때문에 토큰이 유효하여 자동으로 로그인시에는 소켓 또한 바로 연결되어 사용이 가능하다.

          ** 로그인 상태에서 /tweet 서비스를 사용하다. 로그인이 만료되어 해지 된다면?
          - authErrorEventBus.notify()호출시 콜백에서 소켓을 해지 해야한다.
          TODO: 리엑트를 코드를 바꿔야 함으로 보류
        */
      }
    });
  }

  /**
   * ### Socket에서 사용할 이벤트 생성
   * @param {string} event 생성할 이벤트 명
   * @param {function} callback 이벤트에서 실행할 콜백
   * @returns {function} emitter.removeListener(event, callback)
   * - 생성한 이벤트 제거하는 함수 리턴
   */
  onSync(event, callback) {
    // 소켓이 연결되었는지 확인
    if (!this.io.connected) {
      this.io.connect(); // 연결 시도
    }
    /* ### 이벤트 생성: 
      io.emit(event, value)가 트리거 되면 전달된 콜백이 실행된다. */
    this.io.on(event, message => callback(message));

    /* ### 이벤트 제거 함수를 콜백으로 리턴:
      이 메서드를 사용하는 쪽에서 생성한 이벤트를 제거할 수 있도록 이벤트 제거 함수 리턴 */
    return () => this.io.off(event);
  }

  disconnect() {
    this.io.disconnect();
  }
}
