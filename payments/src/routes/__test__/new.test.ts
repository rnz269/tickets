import request from 'supertest';
import { Order } from '../../models/order';
import { app } from '../../app';
import mongoose from 'mongoose';
import { OrderStatus } from '@rntickets/common';
import { stripe } from '../../stripe';
import { Payment } from '../../models/payment';

/*
// Uncomment for Approach 2: mocked version
jest.mock('../../stripe.ts');
*/

it('throws 404 when purchasing an order that does not exist', async () => {
  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin())
    .send({
      token: 'blah',
      orderId: mongoose.Types.ObjectId().toHexString(),
    })
    .expect(404);
});

it('throws 401 if user is not owner of order', async () => {
  const user = global.signin();
  // create order
  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    userId: mongoose.Types.ObjectId().toHexString(),
    status: OrderStatus.Created,
    price: 1000,
  });
  await order.save();

  await request(app)
    .post('/api/payments')
    .set('Cookie', user)
    .send({
      token: 'blah',
      orderId: order.id,
    })
    .expect(401);
});

it('throws 400 if order has status cancelled', async () => {
  const userId = mongoose.Types.ObjectId().toHexString();

  // create order with defined userId
  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    userId,
    status: OrderStatus.Cancelled,
    price: 1000,
  });
  await order.save();

  // make request with appropriate cookie containing payload of userId
  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin(userId))
    .send({
      token: 'blah',
      orderId: order.id,
    })
    .expect(400);
});

// Test Approach 1: Realistic test implementation
// setup:
// a) remove jest.mock(..) at top of file, and rename the mocked stripe file to stripe.ts.old
// b) in setup.ts, add in the actual stripe secret as a hard string env variable (or could do this on computer, more safe)

it('returns 201 with valid inputs', async () => {
  const userId = mongoose.Types.ObjectId().toHexString();
  const price = Math.floor(Math.random() * 100000);
  // create order with defined userId
  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    userId,
    status: OrderStatus.Created,
    price,
  });
  await order.save();

  // make request with appropriate cookie containing payload of userId
  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin(userId))
    .send({
      token: 'tok_visa',
      orderId: order.id,
    })
    .expect(201);

  // make request directly to Stripe API for 10 recent charges, iterate to find matching amount
  const charges = await stripe.charges.list({});
  const chargeFound = charges.data.find(
    (charge) => charge.amount === price * 100
  );
  expect(chargeFound).toBeDefined();
  expect(chargeFound!.currency).toEqual('usd');

  // find on both properties, just for added comfort that we're retrieving correct record
  const payment = await Payment.findOne({
    orderId: order.id,
    stripeId: chargeFound!.id,
  });

  expect(payment).not.toBeNull(); // gotcha: null and undefined are two different values
});

/*
// Test Approach 2: Mocked test implementation
// setup: undo setps a and b from Approach 1 setup
it('returns 201 with valid inputs', async () => {
  const userId = mongoose.Types.ObjectId().toHexString();

  // create order with defined userId
  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    userId,
    status: OrderStatus.Created,
    price: 99.99,
  });
  await order.save();

  // make request with appropriate cookie containing payload of userId
  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin(userId))
    .send({
      token: 'tok_visa',
      orderId: order.id,
    })
    .expect(201);

  // ensure the Stripe API function has been called
  expect(stripe.charges.create).toHaveBeenCalled();
  // don't need JSON.parse(..) here, as arg should be in JS obj form (natsWrapper.publish converted JS obj. to JSON)
  const chargeOptions = (stripe.charges.create as jest.Mock).mock.calls[0][0];
  // ensure the Stripe API function has been called with the correct args
  expect(chargeOptions.amount).toEqual(order.price * 100);
  expect(chargeOptions.currency).toEqual('usd');
  expect(chargeOptions.source).toEqual('tok_visa');
});
*/
