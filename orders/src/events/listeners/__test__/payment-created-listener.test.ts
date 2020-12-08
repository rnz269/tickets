import mongoose from 'mongoose';
import { PaymentCreatedListener } from '../payment-created-listener';
import { natsWrapper } from '../../../nats-wrapper';
import { PaymentCreatedEvent } from '@rntickets/common';
import { Message } from 'node-nats-streaming';
import { Order, OrderStatus } from '../../../models/order';
import { Ticket } from '../../../models/ticket';

const setup = async () => {
  const listener = new PaymentCreatedListener(natsWrapper.client);

  const ticket = Ticket.build({
    id: mongoose.Types.ObjectId().toHexString(),
    title: 'cubs ticket',
    price: 20,
  });
  await ticket.save();

  const order = Order.build({
    userId: 'abd',
    status: OrderStatus.Created,
    expiresAt: new Date(),
    ticket,
  });
  await order.save();

  const data: PaymentCreatedEvent['data'] = {
    id: 'abc',
    orderId: order.id,
    stripeId: 'cde',
  };

  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  return { listener, ticket, order, data, msg };
};

it('ensures order status has been updated to completed', async () => {
  const { listener, ticket, order, data, msg } = await setup();
  await listener.onMessage(data, msg);

  const updatedOrder = await Order.findById(order.id);
  expect(updatedOrder!.status).toEqual(OrderStatus.Complete);
});

it('ensures msg was acked', async () => {
  const { listener, ticket, order, data, msg } = await setup();
  await listener.onMessage(data, msg);
  expect(msg.ack).toHaveBeenCalled();
});
