import nats from 'node-nats-streaming';
import { TicketCreatedPublisher } from './events/ticket-created-publisher';

console.clear();

// connect to NATS Streaming Server, returns a client
const stan = nats.connect('ticketing', 'abc', {
  url: 'http://localhost:4222',
});

// then, we'll wait for stan to connect to NSS
stan.on('connect', async () => {
  console.log('Publisher connected to NATS');

  const publisher = new TicketCreatedPublisher(stan);
  try {
    await publisher.publish({
      id: '123',
      title: 'concert',
      price: 20,
    });
  } catch (err) {
    console.error(err);
  }
});
