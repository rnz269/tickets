import { Message } from 'node-nats-streaming';
import { Listener, ExpirationCompleteEvent, Subjects } from '@rntickets/common';
import { queueGroupName } from './queue-group-name';
import { Order, OrderStatus } from '../../models/order';
import { OrderCancelledPublisher } from '../publishers/order-cancelled-publisher';

export class ExpirationCompleteListener extends Listener<ExpirationCompleteEvent> {
  readonly subject = Subjects.ExpirationComplete;
  queueGroupName = queueGroupName;
  async onMessage(data: ExpirationCompleteEvent['data'], msg: Message) {
    // find relevant order in orders collection
    const order = await Order.findById(data.orderId).populate('ticket');
    if (!order) {
      throw new Error('Order not found');
    }

    // if order status is already complete, then return early, as we don't want to cancel an already completed order
    if (order.status === OrderStatus.Complete) {
      return msg.ack();
    }

    // update order's status to cancelled
    order.set({ status: OrderStatus.Cancelled });
    await order.save();

    // publish OrderCancelledEvent
    await new OrderCancelledPublisher(this.client).publish({
      id: order.id,
      version: order.version,
      ticket: { id: order.ticket.id },
    });

    // ack message
    msg.ack();
  }
}
