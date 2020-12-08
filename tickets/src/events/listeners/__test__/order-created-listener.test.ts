import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';
import { OrderCreatedEvent, OrderStatus } from '@rntickets/common';
import { natsWrapper } from '../../../nats-wrapper';
import { OrderCreatedListener } from '../order-created-listener';
import { Ticket } from '../../../models/ticket';

const setup = async () => {
  // Create an instance of OrderCreatedListener
  const listener = new OrderCreatedListener(natsWrapper.client);

  // Create a ticket record and save it to Tickets DB
  const ticket = Ticket.build({
    title: 'cubs game',
    price: 100,
    userId: 'abc',
  });
  await ticket.save();

  // Create a data object with necessary properties to fulfill 1st arg to onMessage
  const data: OrderCreatedEvent['data'] = {
    id: mongoose.Types.ObjectId().toHexString(),
    version: 0,
    status: OrderStatus.Created,
    userId: 'edf',
    expiresAt: 'blahblah',
    ticket: {
      id: ticket.id,
      price: ticket.price,
    },
  };

  // Create a msg object with necessary properties to fulfill 2nd arg to onMessage
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  return { listener, ticket, data, msg };
};

it('sets orderId property to ticket in its DB', async () => {
  // perform setup
  const { listener, ticket, data, msg } = await setup();

  // call onMessage method
  await listener.onMessage(data, msg);

  // query db for the updated ticket
  const updatedTicket = await Ticket.findById(ticket.id);

  // make assertions on updated ticket, ensuring it has the correct order id
  expect(updatedTicket!.orderId).toEqual(data.id);
});

it('acks the message', async () => {
  // perform setup
  const { listener, ticket, data, msg } = await setup();

  // call onMessage method
  await listener.onMessage(data, msg);

  // ensure msg was acked
  expect(msg.ack).toHaveBeenCalled();
});

it('publishes a TicketUpdatedEvent', async () => {
  // perform setup
  const { listener, ticket, data, msg } = await setup();

  // call onMessage method
  await listener.onMessage(data, msg);

  // make assertion that the publish was called
  expect(natsWrapper.client.publish).toHaveBeenCalled();

  // make assertion that publish was called with a data object with the correct orderId and ticketId property
  const ticketUpdatedData = JSON.parse(
    (natsWrapper.client.publish as jest.Mock).mock.calls[0][1]
  );

  expect(ticketUpdatedData.orderId).toEqual(data.id);

  expect(ticketUpdatedData.id).toEqual(data.ticket.id);
});
