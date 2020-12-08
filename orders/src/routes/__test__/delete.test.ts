import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../app';
import { Order, OrderStatus } from '../../models/order';
import { Ticket, TicketDoc } from '../../models/ticket';
import { natsWrapper } from '../../nats-wrapper';

// helper to expedite process of creating multiple tickets
const buildTicket = async (title: string, price: number) => {
  const ticket = Ticket.build({
    id: mongoose.Types.ObjectId().toHexString(),
    title,
    price,
  });
  await ticket.save();
  return ticket;
};

// helper to expedite process of creating multiple orders
const createOrder = async (user: string[], ticket: TicketDoc) => {
  return request(app)
    .post('/api/orders')
    .set('Cookie', user)
    .send({ ticketId: ticket.id })
    .expect(201);
};

it('order not found returns 404', async () => {
  const orderId = mongoose.Types.ObjectId().toHexString();
  await request(app)
    .delete(`/api/orders/${orderId}`)
    .set('Cookie', global.signin())
    .send()
    .expect(404);
});

it('user attempting to access order he does not own returns 401', async () => {
  // SETUP
  const user1 = global.signin();
  const user2 = global.signin();
  const ticket = await buildTicket('cubs game', 100);
  const order = await createOrder(user1, ticket);

  // now, user2 will try to access ticket owned by user1
  await request(app)
    .delete(`/api/orders/${order.body.id}`)
    .set('Cookie', user2)
    .send()
    .expect(401);
});

it('user accessing order he owns marks order as cancelled', async () => {
  // SETUP
  const user = global.signin();
  const ticket = await buildTicket('cubs game', 100);
  const order = await createOrder(user, ticket);
  expect(order.body.status).toEqual(OrderStatus.Created);

  // now, user will access his own ticket
  // cannot save reference here to do an expectation, as 204 implies deletion
  await request(app)
    .delete(`/api/orders/${order.body.id}`)
    .set('Cookie', user)
    .send()
    .expect(204);

  // fetch order out of db and ensure its status property is 'cancelled'
  const updatedOrder = await Order.findById(order.body.id);
  expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);
});

it('emits an order cancelled event', async () => {
  // SETUP
  const user = global.signin();
  const ticket = await buildTicket('cubs game', 100);
  const order = await createOrder(user, ticket);
  expect(order.body.status).toEqual(OrderStatus.Created);

  // now, user will access his own ticket
  // cannot save reference here to do an expectation, as 204 implies deletion
  await request(app)
    .delete(`/api/orders/${order.body.id}`)
    .set('Cookie', user)
    .send()
    .expect(204);

  // expect that the publish fn was called
  expect(natsWrapper.client.publish).toHaveBeenCalled();
});
