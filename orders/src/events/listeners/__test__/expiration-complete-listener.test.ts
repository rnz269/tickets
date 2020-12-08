import mongoose from 'mongoose';
import { ExpirationCompleteListener } from '../expiration-complete-listener';
import { natsWrapper } from '../../../nats-wrapper'; // will import mock in testing environment!
import { Ticket } from '../../../models/ticket';
import { Order, OrderStatus } from '../../../models/order';
import { Message } from 'node-nats-streaming';
import { ExpirationCompleteEvent } from '@rntickets/common';

const setup = async () => {
  // create a listener instance
  const listener = new ExpirationCompleteListener(natsWrapper.client);

  // create a ticket
  const ticket = Ticket.build({
    id: mongoose.Types.ObjectId().toHexString(),
    title: 'cubs game',
    price: 100,
  });
  await ticket.save();

  // create an order
  const order = Order.build({
    userId: 'abc',
    status: OrderStatus.Created,
    expiresAt: new Date(),
    ticket,
  });
  await order.save();

  /*
  // alternative way of creating an order
  const { body: order } = await request(app)
    .post('/api/orders')
    .set('Cookie', global.signin())
    .send({
      ticketId: ticket.id,
    });
  */

  // create a data object
  const data: ExpirationCompleteEvent['data'] = {
    orderId: order.id,
  };

  // create a msg object
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  return { listener, order, data, msg };
};

it('sets status of relevant order to cancelled', async () => {
  const { listener, order, data, msg } = await setup();

  // ensure we have an order with status = created
  const checkOrder = await Order.findById(order.id);
  expect(checkOrder!.status).toBe(OrderStatus.Created);

  // call onMessage
  await listener.onMessage(data, msg);

  // fetch updated order
  const updatedOrder = await Order.findById(order.id);

  // expect order to have status of cancelled
  expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);
});

it('publishes OrderCancelledEvent', async () => {
  const { listener, data, msg } = await setup();

  // call onMessage
  await listener.onMessage(data, msg);

  // expect the publish method to have been invoked
  expect(natsWrapper.client.publish).toHaveBeenCalled();

  // grab data that OrderCancelledPublisher supplied as argument to publish
  const eventData = JSON.parse(
    (natsWrapper.client.publish as jest.Mock).mock.calls[0][1]
  );

  // expect the publish arg's id property to equal the data.orderId we created above & supplied to listener.onMessage(..)
  expect(eventData.id).toEqual(data.orderId);
});

it('acks the message', async () => {
  const { listener, data, msg } = await setup();

  // call onMessage
  await listener.onMessage(data, msg);

  // expect the message to have been acked
  expect(msg.ack).toHaveBeenCalled();
});
