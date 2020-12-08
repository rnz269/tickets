import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';
import { TicketCreatedEvent } from '@rntickets/common'; // b)
import { TicketCreatedListener } from '../ticket-created-listener';
import { natsWrapper } from '../../../nats-wrapper'; // a) test-env imports mocked natsWrapper!
import { Ticket } from '../../../models/ticket';

const setup = () => {
  // a) create an instance of the TicketCreatedListener
  const listener = new TicketCreatedListener(natsWrapper.client);

  // b) create a fake data event -- it must satisfy TicketCreatedEvent['data']
  const data: TicketCreatedEvent['data'] = {
    id: new mongoose.Types.ObjectId().toHexString(), // must be real, as test will save this in mongoDB
    version: 0,
    title: 'cubs game',
    price: 50,
    userId: new mongoose.Types.ObjectId().toHexString(), // we're not using in onMessage(..), but will provide a valid one anyway
  };

  // c) create a fake message object
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  return { listener, data, msg };
};

it('creates and saves a ticket', async () => {
  // create an instance of the TicketCreatedListener, a fake data event, and a fake msg object
  const { listener, data, msg } = setup();

  // call the onMessage function with the data object + message object
  await listener.onMessage(data, msg);

  // write assertions to ensure a ticket was created
  const ticket = await Ticket.findById(data.id);

  expect(ticket).toBeDefined();
  expect(ticket!.title).toEqual(data.title);
  expect(ticket!.price).toEqual(data.price);
});

it('acks the message', async () => {
  // create an instance of the TicketCreatedListener, a fake data event, and a fake msg object
  const { listener, data, msg } = setup();

  // call the onMessage function with the data object + message object
  await listener.onMessage(data, msg);

  // write assertions to ensure ack function is called
  expect(msg.ack).toHaveBeenCalled();
});
