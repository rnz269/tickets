import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';
import { OrderCancelledEvent } from '@rntickets/common';
import { OrderCancelledListener } from '../order-cancelled-listener';
import { Ticket } from '../../../models/ticket';
import { natsWrapper } from '../../../nats-wrapper';

/* Test OrderCancelledListener to ensure it performs appropriate logic upon receiving an OrderCancelledEvent */

const setup = async () => {
  // Create an instance of OrderCancelledListener
  const listener = new OrderCancelledListener(natsWrapper.client);

  // Create a ticket in tickets service's database
  const ticket = Ticket.build({
    title: 'cubs game',
    price: 100,
    userId: 'abc',
  });

  ticket.orderId = mongoose.Types.ObjectId().toHexString();
  await ticket.save();

  // Create a fake data object to simulate an OrderCancelledEvent
  const data: OrderCancelledEvent['data'] = {
    id: ticket.orderId,
    version: 0,
    ticket: {
      id: ticket.id,
    },
  };

  // create a fake msg object
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  return { listener, ticket, data, msg };
};

it('updates the ticket, publishes an event with correct args, and acks the message', async () => {
  // call setup function
  const { listener, ticket, data, msg } = await setup();

  // ensuring that our setup function properly added a ticket w/ orderId to our tickets database
  expect(ticket.orderId).toBeDefined();

  // listener receives event and process it
  await listener.onMessage(data, msg);

  // retrieve updated ticket from database
  const updatedTicket = await Ticket.findById(data.ticket.id);

  // expect that orderId property is now null
  expect(updatedTicket!.orderId).not.toBeDefined();

  // expect that publish method has been called
  expect(natsWrapper.client.publish).toHaveBeenCalled();

  // expect that the publish method has been called with correct data arguments
  const ticketData = JSON.parse(
    (natsWrapper.client.publish as jest.Mock).mock.calls[0][1]
  );

  expect(ticketData.id).toEqual(data.ticket.id);
  expect(ticketData.orderId).not.toBeDefined();

  // expect that msg has been acked
  expect(msg.ack).toHaveBeenCalled();
});
