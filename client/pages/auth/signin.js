import { useState } from 'react';
import Router from 'next/router';
import useRequest from '../../hooks/use-request';

const signin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { doRequest, errors } = useRequest({
    url: '/api/users/signin',
    method: 'post',
    body: {
      email,
      password,
    },
    onSuccess: () => {
      Router.push('/');
    },
  });

  function handleChange(event) {
    const { name, value } = event.target;
    name === 'email' ? setEmail(value) : setPassword(value);
  }

  function handleSubmit(event) {
    // ensure form doesn't submit itself to browser
    event.preventDefault();
    // calling doRequest updates useRequest's state (errors), & we receive back new
    // errors array from hook
    doRequest();
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Sign In</h1>
      <div className="form-group">
        <label>Email Address</label>
        <input
          name={'email'}
          value={email}
          onChange={handleChange}
          className="form-control"
        />
      </div>
      <div className="form-group">
        <label>Password</label>
        <input
          name={'password'}
          value={password}
          onChange={handleChange}
          type="password"
          className="form-control"
        />
      </div>
      {errors}
      <button className="btn btn-primary">Sign in</button>
    </form>
  );
};

export default signin;
