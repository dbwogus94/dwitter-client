import React, { useState } from 'react';

const NewTweetForm = ({ tweetService, onError }) => {
  const [tweet, setTweet] = useState('');

  const onSubmit = async event => {
    event.preventDefault();
    tweetService
      .postTweet(tweet)
      .then(() => {
        setTweet('');
        //onCreated(created); - 제거
        // -> 기존: post /tweets의 응답결과를 사용하여 추가
        // -> 변경: 소켓을 통해 받은 데이터(브로드케스트된 데이터)를 사용하여 추가
      })
      .catch(onError);
  };

  const onChange = event => {
    setTweet(event.target.value);
  };

  return (
    <form className="tweet-form" onSubmit={onSubmit}>
      <input
        type="text"
        placeholder="Edit your tweet"
        value={tweet}
        required
        autoFocus
        onChange={onChange}
        className="form-input tweet-input"
      />
      <button type="submit" className="form-btn">
        Post
      </button>
    </form>
  );
};

export default NewTweetForm;
