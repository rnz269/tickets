import { useState } from 'react';
import Router from 'next/router';
import useRequest from '../../hooks/use-request';

const NewTicket = () => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');

  const { doRequest, errors } = useRequest({
    url: '/api/tickets',
    method: 'post',
    body: {
      title,
      price,
    },
    onSuccess: (data) => {
      Router.push('/');
    },
  });

  function handleChange(event) {
    const { name, value } = event.target;
    name === 'title' ? setTitle(value) : setPrice(value);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      await doRequest();
    } catch (e) {
      console.log(e);
    }
  }

  const onBlur = () => {
    const value = parseFloat(price);
    if (isNaN(value)) {
      return;
    }
    // rounding step
    setPrice(value.toFixed(2));
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Create a Ticket</h1>
      <div className="form-group">
        <label>Title</label>
        <input
          name={'title'}
          value={title}
          onChange={handleChange}
          className="form-control"
        />
      </div>
      <div className="form-group">
        <label>Price</label>
        <input
          name={'price'}
          value={price}
          onBlur={onBlur}
          onChange={handleChange}
          className="form-control"
        />
      </div>
      {errors}
      <button className="btn btn-primary">Submit</button>
    </form>
  );
};

export default NewTicket;
