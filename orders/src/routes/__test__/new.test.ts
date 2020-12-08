import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../app';
import { Ticket } from '../../models/ticket';
import { Order, OrderStatus } from '../../models/order';
import { natsWrapper } from '../../nats-wrapper'; // imports mock natsWrapper, too!

const id = mongoose.Types.ObjectId().toHexString();

it('returns an error if the ticket does not exist', async () => {
  const ticketId = mongoose.Types.ObjectId();
  await request(app)
    .post('/api/orders')
    .set('Cookie', global.signin())
    .send({ ticketId })
    .expect(404);
});

it('returns an error if the ticket is already reserved', async () => {
  // SETUP
  // create a ticket in database
  const ticket = Ticket.build({ id, title: 'cubs game', price: 100 });
  await ticket.save();
  // create an order to reserve ticket, save in database
  const order = Order.build({
    userId: 'rahul',
    status: OrderStatus.Created,
    expiresAt: new Date(),
    ticket,
  });
  await order.save();
  // END SETUP

  // create a separate order to attempt to reserve the reserved ticket
  await request(app)
    .post('/api/orders')
    .set('Cookie', global.signin())
    .send({ ticketId: ticket.id })
    .expect(400);
});

it('reserves a ticket', async () => {
  // SETUP
  // create a ticket in database
  const ticket = Ticket.build({ id, title: 'cubs game', price: 100 });
  await ticket.save();
  // END SETUP

  // make an order request to reserve this ticket
  await request(app)
    .post('/api/orders')
    .set('Cookie', global.signin())
    .send({ ticketId: ticket.id })
    .expect(201);
});

it('emits an order created event', async () => {
  // SETUP
  // create a ticket in database
  const ticket = Ticket.build({ id, title: 'cubs game', price: 200 });
  await ticket.save();

  await request(app)
    .post('/api/orders')
    .set('Cookie', global.signin())
    .send({ ticketId: ticket.id })
    .expect(201);

  // expect that the publish fn was called
  expect(natsWrapper.client.publish).toHaveBeenCalled();
});
