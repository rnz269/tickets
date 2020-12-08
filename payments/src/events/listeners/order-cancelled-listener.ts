import {
  Listener,
  Subjects,
  OrderCancelledEvent,
  OrderStatus,
} from '@rntickets/common';
import { queueGroupName } from './queue-group-name';
import { Message } from 'node-nats-streaming';
import { Order } from '../../models/order';

export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
  readonly subject = Subjects.OrderCancelled;
  queueGroupName = queueGroupName;
  async onMessage(data: OrderCancelledEvent['data'], msg: Message) {
    // find relevant order
    const order = await Order.findByEvent(data);

    // if not found, throw error
    if (!order) {
      throw new Error('Order not found');
    }

    // update status property
    order.set({ status: OrderStatus.Cancelled });

    // save order to db
    await order.save();

    // ack message
    msg.ack();
  }
}
