import { createContext, createRef, useCallback, useContext, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import Header from '../components/Header';
import Login from '../pages/Login';

const AuthContext = createContext({});

const contextRef = createRef();

export function AuthProvider({ authService, authErrorEventBus, children }) {
  const [user, setUser] = useState(undefined);

  useImperativeHandle(contextRef, () => (user ? user.token : undefined));

  // useEffect는 리엑트 렌더링 이후 실행된다.
  useEffect(() => {
    // AuthErrorEventBus 클래스의
    // 인스턴스인 authErrorEventBus의 listen()를 호출한다.
    // listen()는 callback를 설정하는 메서드이다.
    authErrorEventBus.listen(err => {
      console.log(err);
      setUser(undefined);
      // setUser()를 통해 로그인된 사용자를 초기화 한다.
      // 그렇게 되면 로그인 페이지로 이동된다.
    });
  }, [authErrorEventBus]);

  useEffect(() => {
    authService.me().then(setUser).catch(console.error);
  }, [authService]);

  const signUp = useCallback(
    async (username, password, name, email, url) => authService.signup(username, password, name, email, url).then(user => setUser(user)),
    [authService]
  );

  const logIn = useCallback(async (username, password) => authService.login(username, password).then(user => setUser(user)), [authService]);

  const logout = useCallback(async () => authService.logout().then(() => setUser(undefined)), [authService]);

  const context = useMemo(
    () => ({
      user,
      signUp,
      logIn,
      logout,
    }),
    [user, signUp, logIn, logout]
  );

  return (
    <AuthContext.Provider value={context}>
      {user ? (
        children
      ) : (
        <div className="app">
          <Header />
          <Login onSignUp={signUp} onLogin={logIn} />
        </div>
      )}
    </AuthContext.Provider>
  );
}

export class AuthErrorEventBus {
  listen(callback) {
    this.callback = callback;
  }
  notify(error) {
    this.callback(error);
  }
}

export default AuthContext;
export const fetchToken = () => contextRef.current;
export const useAuth = () => useContext(AuthContext);
