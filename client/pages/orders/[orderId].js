import { useState, useEffect } from 'react';
import StripeCheckout from 'react-stripe-checkout';
import Router from 'next/router';
import useRequest from '../../hooks/use-request';

const OrderShow = ({ currentUser, order }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const { doRequest, errors } = useRequest({
    url: '/api/payments',
    method: 'post',
    body: { orderId: order.id },
    onSuccess: (payment) => Router.push('/orders'),
  });
  useEffect(() => {
    const findTimeLeft = () => {
      const msLeft = new Date(order.expiresAt) - new Date();
      setTimeLeft(Math.round(msLeft / 1000));
    };
    findTimeLeft();
    const interval = setInterval(findTimeLeft, 1000);
    return () => clearInterval(interval);
  }, []);

  if (timeLeft < 0) {
    return <div>Order Expired</div>;
  }

  return (
    <div>
      <h1>Purchasing {order.ticket.title}</h1>
      <p>You have {timeLeft} seconds until order expires</p>
      <StripeCheckout
        token={({ id }) => doRequest({ token: id })}
        stripeKey="pk_test_51Hv50IHyADH4ddLQSdETMUG8REGkGVR6Gg9VjPmRGpuFRaaGkkaIPZPgcmIYJT1rNn2StY3Z3Q6t2p0HGhxWuMit00C8iSFPX3"
        amount={order.ticket.price * 100} // multiply to get cents for Stripe
        email={currentUser.email}
      />
      {errors}
    </div>
  );
};

OrderShow.getInitialProps = async (context, client) => {
  const { orderId } = context.query;
  const response = await client.get(`/api/orders/${orderId}`);
  return { order: response.data };
};

export default OrderShow;

/*
// My version:
  const [time, setTime] = useState(60);
  useEffect(() => {
    if (time > 0) {
      setTimeout(() => {
        const timeRemaining = Math.floor(
          (new Date(order.expiresAt) - new Date()) / 1000
        );
        setTime(timeRemaining);
      }, 1000);
    }
  }, [time]);
*/

/*
// My attempt with setInterval
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const interval = setInterval(() => {
      const timeRemaining = Math.floor(
        (new Date(order.expiresAt) - new Date()) / 1000
      );
      if (timeRemaining > 0) {
        setTimeLeft(timeRemaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);
*/
