export default class AuthService {
  /**
   * AuthService 생성자
   * @param {*} http - HttpClient
   * @param {*} tokenStorage - TokenStorage
   */
  constructor(http, tokenStorage, socket) {
    this.http = http;
    this.tokenStorage = tokenStorage;
    this.socket = socket;
  }

  async signup(username, password, name, email, url) {
    const data = await this.http.fetch('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, password, name, email, url }),
    });

    // 응답 body의 jwt를 저장소에 저장한다.
    const { accessToken } = data;
    this.tokenStorage.saveToken({ accessToken, username });
    return data;
  }

  async login(username, password) {
    const data = await this.http.fetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    // 응답 body의 jwt를 저장소에 저장한다.
    const { accessToken } = data;
    this.tokenStorage.saveToken({ accessToken, username });
    return data;
  }

  // 클라이언트가 가진 토큰이 유효한지 확인
  async me() {
    const { accessToken, username } = this.tokenStorage.getToken();
    const result = await this.http.fetch('/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // 엑세스 토큰 만료라면? 재발급 요청
    if (result === 401) {
      return this.http.fetch(`/auth/refresh?username=${username}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    }

    return result;
  }

  // 로그아웃
  async logout() {
    /* 서버 로그아웃 처리  */
    // 로그아웃 요청
    const { accessToken } = this.tokenStorage.getToken();
    await this.http.fetch(`/auth/logout`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    /* 클라이언트 로그아웃 처리  */
    // 토큰 제거
    // -> HTTP 프로토콜은 무상태이다. 때문에 로그아웃은 token만 제거하면 된다.
    this.tokenStorage.clearToken();
    // 연결된 소켓 닫기
    // -> ws 프로토콜은 상태가 있다. 때문에 연결을 끊는다는 이벤트를 호출하여 서버에게 알린다.
    this.socket.disconnect();
    return;
  }
}
