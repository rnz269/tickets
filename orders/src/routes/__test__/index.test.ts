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

it('returns orders for the current user', async () => {
  // SETUP

  // create three tickets
  const ticket1 = await buildTicket('cubs game', 100);
  const ticket2 = await buildTicket('sox game', 10);
  const ticket3 = await buildTicket('cardinals game', 50);

  const user1 = global.signin();
  const user2 = global.signin();

  // create 3 orders for the 3 tickets, first as user1 and next 2 as user2
  const order1 = await createOrder(user1, ticket1);
  const order2 = await createOrder(user2, ticket2);
  const order3 = await createOrder(user2, ticket3);

  // END SETUP

  // get all orders for user2
  const orders = await request(app)
    .get('/api/orders')
    .set('Cookie', user2)
    .send()
    .expect(200);

  expect(orders.body.length).toEqual(2);
  // ensure orders are correct
  expect(orders.body[0].id).toEqual(order2.body.id);
  expect(orders.body[1].id).toEqual(order3.body.id);
  // ensure the tickets on orders are correct
  expect(orders.body[0].ticket.id).toEqual(ticket2.id);
  expect(orders.body[1].ticket.id).toEqual(ticket3.id);
});
