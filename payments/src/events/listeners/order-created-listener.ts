import { Listener, Subjects, OrderCreatedEvent } from '@rntickets/common';
import { queueGroupName } from './queue-group-name';
import { Message } from 'node-nats-streaming';
import { Order } from '../../models/order';

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  readonly subject = Subjects.OrderCreated;
  queueGroupName = queueGroupName;
  async onMessage(data: OrderCreatedEvent['data'], msg: Message) {
    // create an order
    const order = Order.build({
      id: data.id,
      userId: data.userId,
      status: data.status,
      price: data.ticket.price,
    });

    // save order to db
    await order.save();

    // ack message
    msg.ack();
  }
}
