import mongoose from 'mongoose';
import { OrderCancelledEvent, OrderStatus } from '@rntickets/common';
import { Message } from 'node-nats-streaming';
import { OrderCancelledListener } from '../order-cancelled-listener';
import { natsWrapper } from '../../../nats-wrapper';
import { Order } from '../../../models/order';

const setup = async () => {
  // create instance of listener
  const listener = new OrderCancelledListener(natsWrapper.client);

  // create order record and save to orders collection
  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    userId: 'abc',
    status: OrderStatus.Created,
    price: 100,
  });

  await order.save();

  // create data object
  const data: OrderCancelledEvent['data'] = {
    id: order.id,
    version: 1,
    ticket: {
      id: 'blah',
    },
  };

  // create msg object
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  return { listener, data, msg };
};

it('changes status of relevant order to cancelled', async () => {
  // call setup function
  const { listener, data, msg } = await setup();

  // test listener
  await listener.onMessage(data, msg);

  // grab order
  const order = await Order.findById(data.id);

  // make expectation
  expect(order!.status).toEqual(OrderStatus.Cancelled);
});

it('acks the message', async () => {
  // call setup function
  const { listener, data, msg } = await setup();

  // test listener
  await listener.onMessage(data, msg);

  // ensure msg was acked
  expect(msg.ack).toHaveBeenCalled();
});
