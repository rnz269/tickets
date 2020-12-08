import request from 'supertest';
import { app } from '../../app';
import { Ticket } from '../../models/ticket';
import { natsWrapper } from '../../nats-wrapper'; // imports mock natsWrapper, too!

it('has a route handler listening to /api/tickets for post requests', async () => {
  const response = await request(app).post('/api/tickets').send({});
  expect(response.status).not.toEqual(404);
});

it('can only be accessed if user is signed in', async () => {
  await request(app).post('/api/tickets').send({}).expect(401);
});

it('returns a status other than 401 if the user is signed in', async () => {
  const cookie = global.signin();
  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', cookie)
    .send({});
  expect(response.status).not.toEqual(401);
});

it('returns an error if signed-in user sends invalid title', async () => {
  const cookie = global.signin();
  await request(app)
    .post('/api/tickets')
    .set('Cookie', cookie)
    .send({
      title: '',
      price: '10.00',
    })
    .expect(400);
});

it('returns an error if signed-in user sends invalid price', async () => {
  const cookie = global.signin();
  await request(app)
    .post('/api/tickets')
    .set('Cookie', cookie)
    .send({
      title: 'calculator',
      price: -10,
    })
    .expect(400);
});

it('creates a ticket when provided with valid inputs', async () => {
  // just asserting a 201 doesn't check if ticket was created & saved to DB
  // don't have anything inside our tickets project yet to work with MongoDB, so reminder:
  // add in a check to make sure a ticket was saved to the DB
  // count number of tickets that exist before, then count number after, ensure it's +1
  let tickets = await Ticket.find({});
  expect(tickets.length).toEqual(0); // should be guaranteed due to test/setup file

  const title = 'calculator';

  await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({
      title,
      price: 20,
    })
    .expect(201);

  tickets = await Ticket.find({});
  expect(tickets.length).toEqual(1);
  expect(tickets[0].price).toEqual(20);
  expect(tickets[0].title).toEqual(title);
});

it('publishes an event', async () => {
  const title = 'calculator';

  await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({
      title,
      price: 20,
    })
    .expect(201);

  // should be able to say that the publish fn was called -- to do so, at top, import nats-wrapper
  expect(natsWrapper.client.publish).toHaveBeenCalled();
});
