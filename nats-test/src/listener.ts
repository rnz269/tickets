import nats from 'node-nats-streaming';
import { randomBytes } from 'crypto';
import { TicketCreatedListener } from './events/ticket-created-listener';
import { TicketUpdatedListener } from './events/ticket-updated-listener';

console.clear();

// connect to NATS Streaming Server, returns a client
const stan = nats.connect('ticketing', randomBytes(4).toString('hex'), {
  url: 'http://localhost:4222',
});

// after we successfully connect, execute callback
stan.on('connect', () => {
  console.log('Listener connected to NATS');
  stan.on('close', () => {
    console.log('NATS connection closed!');
    process.exit();
  });
  // create new listener and have it start listening for events
  //new TicketCreatedListener(stan).listen();
  new TicketUpdatedListener(stan).listen();
});

// intercept kill signals to cleanup, telling NSS to close connection
process.on('SIGINT', () => stan.close());
process.on('SIGTERM', () => stan.close());
