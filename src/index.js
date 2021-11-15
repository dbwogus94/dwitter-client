import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import AuthService from './service/auth';
import TweetService from './service/tweet';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AuthErrorEventBus } from './context/AuthContext';

import TokenStorage from './db/token';
import HttpClient from './network/http';
import Socket from './network/socket.js'; // 소켓

const baseURL = process.env.REACT_APP_BASE_URL;
const tokenStorage = new TokenStorage();
/* socket.io를 구현한 클래스  */
const socketClient = new Socket(baseURL, () => tokenStorage.getToken());

/* ### authErrorEventBus 
authErrorEventBus.notify()가 호출되면 로그인 페이지로 이동된다.
HttpClient에서 401(인증 실패)코드가 응답되면 authErrorEventBus.notify()를 호출한다.*/
const authErrorEventBus = new AuthErrorEventBus();
const httpClient = new HttpClient(baseURL, authErrorEventBus);
const authService = new AuthService(httpClient, tokenStorage, socketClient);

// **tip:
// 위 처럼 인자를 콜백으로 감싸서 전달하면 tokenStorage의 선언 순서와 상관없이 사용이 가능하다.
// 콜백으로 전달된 함수는 비동기로 실행되기 때문이다.
// -> tokenStorage.getToken()의 결과가 익명함수 콜백으로 매핑된다.
const tweetService = new TweetService(httpClient, tokenStorage, socketClient);

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider authService={authService} authErrorEventBus={authErrorEventBus}>
        <App tweetService={tweetService} />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);
