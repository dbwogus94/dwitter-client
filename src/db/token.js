const TOKEN = 'token';
const USERNAME = 'username';
/* ### localStorage란?
  - web(브라우저)에서 제공하는 API이다. (window.localStorage)
  - 해당 객체에 저장된 데이터는 브라우저 세션간에 공유된다.
  - sessionStorage와 비슷하다.
  - 단, sessionStorage는 페이지를 닫을 때 만료되지만
  - localStorage는 만료되지 않는다.
  - "사생활 보호 모드"에서는 페이지가 닫치면 제거된다.

  Q) localStorage에 저장하는 것은 안전하지 않다. 왜 그럴까? 
  Q) 그렇다면 어디에 저장해야 안전할까?
*/

export default class TokenStorage {
  saveToken(token) {
    localStorage.setItem(TOKEN, token.accessToken);
    localStorage.setItem(USERNAME, token.username);
  }

  getToken() {
    return {
      accessToken: localStorage.getItem(TOKEN),
      username: localStorage.getItem(USERNAME),
    };
  }

  clearToken() {
    localStorage.clear(TOKEN);
    localStorage.clear(USERNAME);
  }
}
