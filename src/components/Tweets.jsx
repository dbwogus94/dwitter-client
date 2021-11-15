import React, { memo, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import Banner from './Banner';
import NewTweetForm from './NewTweetForm';
import TweetCard from './TweetCard';
import { useAuth } from '../context/AuthContext';

const Tweets = memo(({ tweetService, username, addable }) => {
  const [tweets, setTweets] = useState([]);
  const [error, setError] = useState('');
  const history = useHistory();
  const { user } = useAuth();

  useEffect(() => {
    tweetService
      .getTweets(username)
      .then(tweets => setTweets([...tweets]))
      .catch(onError);

    // 소켓 이벤트를 통해 새로운 트윗 추가
    // tweetService.onSync메서드에 정의된 소켓 이벤트 발생시 onCreated()를 호출한다.
    const stopSync = tweetService.onSync(tweet => onCreated(tweet));

    // 컴포넌트가 종료되면 위에서 사용된 소켓 이벤트 제거
    return () => stopSync();
  }, [tweetService, username, user]);

  const onCreated = tweet => {
    // 기존 트윗 목록의 가장 앞에 새로운 트윗을 추가한다.
    setTweets(tweets => [tweet, ...tweets]);
  };

  const onDelete = tweetId =>
    tweetService
      .deleteTweet(tweetId)
      .then(() => setTweets(tweets => tweets.filter(tweet => tweet.id !== tweetId)))
      .catch(error => setError(error.toString()));

  const onUpdate = (tweetId, text) =>
    tweetService
      .updateTweet(tweetId, text)
      .then(updated => setTweets(tweets => tweets.map(item => (item.id === updated.id ? updated : item))))
      .catch(error => error.toString());

  const onUsernameClick = tweet => history.push(`/${tweet.username}`);

  const onError = error => {
    setError(error.toString());
    setTimeout(() => {
      setError('');
    }, 3000);
  };

  return (
    <>
      {addable && <NewTweetForm tweetService={tweetService} onError={onError} /> /* onCreated={onCreated} 제거 */}
      {error && <Banner text={error} isAlert={true} transient={true} />}
      {tweets.length === 0 && <p className="tweets-empty">No Tweets Yet</p>}
      <ul className="tweets">
        {tweets.map(tweet => (
          <TweetCard
            key={tweet.id}
            tweet={tweet}
            owner={tweet.username === user.username}
            onDelete={onDelete}
            onUpdate={onUpdate}
            onUsernameClick={onUsernameClick}
          />
        ))}
      </ul>
    </>
  );
});
export default Tweets;
