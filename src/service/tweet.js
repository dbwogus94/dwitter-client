export default class TweetService {
  /**
   * ### TweetService 생성자
   * @param {class} http - HttpClient
   * @param {class} tokenStorage - TokenStorage
   * @param {class} socket - Socket.io을 구현한 클래스
   */
  constructor(http, tokenStorage, socket) {
    this.http = http;
    this.tokenStorage = tokenStorage;
    this.socket = socket;
  }

  /**
   * ### 전체 트윗 요청 || 특정 유저의 모든 트윗 요청
   * @param {string} username
   * @returns
   * - 200: 성공을 의미, return [tweet, ...]
   * - 401: 인증(token) 실패를 의미
   * - 404: 실패 username의 트윗이 없는 경우를 의미
   */
  async getTweets(username) {
    const query = username ? `?username=${username}` : '';
    return this.http.fetch(`/tweets/${query}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
  }

  /**
   * ### 트윗 작성 요청
   * - 특이 사항:
   *  요청에 성공시 201코드와 함께 생성된 트윗을 응답받는다.
   *  하지만 응답받은 트윗을 사용하지는 않고, 응답된 코드만 사용된다.
   *  새로운 트윗을 추가하는 기능은 onSync(소켓)메서드를 통해 수행한다.
   * @param {string} text - 신규 트윗 내용
   * @returns
   * - 201: 성공적으로 글 작성을 의미, return tweet
   * - 400: text 유효성 검사 실패를 의미
   * - 401: 인증(token) 실패를 의미
   */
  async postTweet(text) {
    return this.http.fetch(`/tweets`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ text }),
    });
  }

  /**
   * ### 트윗 수정 요청
   * @param {string} tweetId - 수정할 트윗 id
   * @param {string} text - 수정 내용
   * @returns
   * - 201: 수정 성공을 의미, return tweet
   * - 400: text 유효성 검사 실패를 의미
   * - 401: 인증(token) 실패를 의미
   * - 403: 인가 실패(수정 권한 없음)를 의미
   * - 404: 요청한 자원 없음을 의미
   */
  async updateTweet(tweetId, text) {
    return this.http.fetch(`/tweets/${tweetId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ text }),
    });
  }

  /**
   * ### 트윗 삭제 요청
   * @param {string} tweetId
   * @returns
   * - 204: 삭제 성공
   * - 401: 인증(token) 실패를 의미
   * - 403: 인가 실패(삭제 권한 없음)를 의미
   * - 404: 요청한 자원 없음을 의미
   */
  async deleteTweet(tweetId) {
    return this.http.fetch(`/tweets/${tweetId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
  }

  /**
   * ### 인증정보 헤더를 리턴
   * @returns Http Authorization header
   */
  getHeaders() {
    const token = this.tokenStorage.getToken();
    return {
      Authorization: `Bearer ${token}`,
      /* Authorization은 인증정보를 담는 위한 정식 헤더이다.
          - Bearer는 인증정보가 token 형태임을 알리는 접두사(type)이다. 
        */
    };
  }

  /**
   * ### TweetService에서 사용할 소켓 이벤트 정의
   * @param {function} callback
   * @returns 소켓에 정의한 이벤트를 제거하는 함수 리턴
   */
  onSync(callback) {
    // 소켓에서 사용할 이벤트 생성
    return this.socket.onSync('tweets', callback);
  }
}
