import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../app';
import { Ticket, TicketDoc } from '../../models/ticket';

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
    .get(`/api/orders/${orderId}`)
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
    .get(`/api/orders/${order.body.id}`)
    .set('Cookie', user2)
    .send()
    .expect(401);
});

it('user accessing order he owns returns 200', async () => {
  // SETUP
  const user = global.signin();
  const ticket = await buildTicket('cubs game', 100);
  const order = await createOrder(user, ticket);

  // now, user will access his own ticket
  const response = await request(app)
    .get(`/api/orders/${order.body.id}`)
    .set('Cookie', user)
    .send()
    .expect(200);

  expect(response.body.id).toEqual(order.body.id);
  expect(response.body.ticket.id).toEqual(ticket.id);
});
