import { Message } from 'node-nats-streaming';
import { OrderCancelledEvent, Subjects, Listener } from '@rntickets/common';
import { queueGroupName } from './queue-group-name';
import { Ticket } from '../../models/ticket';
import { TicketUpdatedPublisher } from '../publishers/ticket-updated-publisher';

export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
  readonly subject = Subjects.OrderCancelled;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderCancelledEvent['data'], msg: Message) {
    // retrieve relevant ticket from DB
    const ticket = await Ticket.findById(data.ticket.id);

    // throw error if ticket not found
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // update the orderId property to null
    ticket.set({ orderId: undefined });

    // save to db
    await ticket.save();

    // publish TicketUpdatedEvent so that dependent services can update data, including version
    await new TicketUpdatedPublisher(this.client).publish({
      id: ticket.id,
      version: ticket.version,
      title: ticket.title,
      price: ticket.price,
      userId: ticket.userId,
      orderId: ticket.orderId,
    });

    // ack message
    msg.ack();
  }
}
