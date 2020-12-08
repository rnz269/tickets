import request from 'supertest';
import { app } from '../../app';

// helper to expedite process of creating multiple tickets
const createTicket = () => {
  return request(app).post('/api/tickets').set('Cookie', global.signin()).send({
    title: 'abcd',
    price: 20,
  });
};

it('has a route handler listening to /api/tickets for GET requests', async () => {
  const response = await request(app).get('/api/tickets').send();
  expect(response.status).not.toEqual(404);
});

it('can fetch a list of tickets', async () => {
  // create a few tickets in db (warning: external dependency on post route)
  await createTicket();
  await createTicket();
  await createTicket();

  // fetch tickets from db
  const tickets = await request(app).get('/api/tickets').send().expect(200);
  expect(tickets.body.length).toEqual(3);
});
