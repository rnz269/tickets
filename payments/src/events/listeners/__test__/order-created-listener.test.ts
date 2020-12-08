import mongoose from 'mongoose';
import { OrderCreatedEvent, OrderStatus } from '@rntickets/common';
import { Message } from 'node-nats-streaming';
import { OrderCreatedListener } from '../order-created-listener';
import { natsWrapper } from '../../../nats-wrapper';
import { Order } from '../../../models/order';

const setup = () => {
  // create instance of listener
  const listener = new OrderCreatedListener(natsWrapper.client);

  // create data object
  const data: OrderCreatedEvent['data'] = {
    id: mongoose.Types.ObjectId().toHexString(),
    version: 0,
    status: OrderStatus.Created,
    userId: 'abc',
    expiresAt: 'blahblah',
    ticket: {
      id: 'blah',
      price: 100,
    },
  };

  // create msg object
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  return { listener, data, msg };
};

it('creates order in payments order collection', async () => {
  // call setup function
  const { listener, data, msg } = setup();

  // test listener
  await listener.onMessage(data, msg);

  // grab order
  const order = await Order.findById(data.id);

  // make expectation
  expect(order!.price).toEqual(data.ticket.price);
});

it('acks the message', async () => {
  // call setup function
  const { listener, data, msg } = setup();

  // test listener
  await listener.onMessage(data, msg);

  // ensure msg was acked
  expect(msg.ack).toHaveBeenCalled();
});
