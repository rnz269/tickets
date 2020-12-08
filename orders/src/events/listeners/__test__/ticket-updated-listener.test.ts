import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';
import { TicketUpdatedEvent } from '@rntickets/common';
import { TicketUpdatedListener } from '../ticket-updated-listener';
import { Ticket } from '../../../models/ticket';
import { natsWrapper } from '../../../nats-wrapper';

// TESTING THE TWO ORDERS SERVICE LISTENERS onMessage(..) METHOD

// setup: create a ticket in the database. Use its id to construct a simulated update event.
const setup = async () => {
  // create a ticket and save to orders ticket collection
  const ticket = Ticket.build({
    id: mongoose.Types.ObjectId().toHexString(),
    title: 'sox game',
    price: 5,
  });
  await ticket.save();

  // instantiate a TicketUpdatedListener
  const listener = new TicketUpdatedListener(natsWrapper.client);

  // construct a data object that simulates a TicketUpdatedEvent
  const data: TicketUpdatedEvent['data'] = {
    id: ticket.id, // use same id
    version: ticket.version + 1,
    title: 'cubs game',
    price: 100,
    userId: mongoose.Types.ObjectId().toHexString(),
  };

  // construct a fake message
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  return { ticket, listener, data, msg };
};

it('updates correct ticket in database', async () => {
  const { ticket, listener, data, msg } = await setup();

  // call listener's onMessage function, providing arguments data and msg
  await listener.onMessage(data, msg);

  // refetch updated ticket from DB
  const updatedTicket = await Ticket.findById(ticket.id);

  // write assertions to ensure ticket was updated
  expect(updatedTicket!.price).toEqual(data.price);
  expect(updatedTicket!.title).toEqual(data.title);
  expect(updatedTicket!.version).toEqual(data.version);
});

it('ensures TicketUpdatedListener calls ack', async () => {
  const { listener, data, msg } = await setup();

  // call listener's onMessage function, providing arguments data and msg
  await listener.onMessage(data, msg);

  // write assertions to ensure ticket was updated
  expect(msg.ack).toHaveBeenCalled();
});

it('ensures TicketUpdatedListener does not call ack when provided events out of order', async () => {
  const { listener, data, msg } = await setup();

  // skip current version to see how listener responds to out of order event
  data.version++;

  // call listener's onMessage function, providing arguments data and msg, data with a bad version
  try {
    await listener.onMessage(data, msg);
  } catch (err) {
    console.log('expecting an error, bad data version supplied: ', err);
  }

  // write assertions to ensure ticket was updated
  expect(msg.ack).not.toHaveBeenCalled();
});
