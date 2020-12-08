import { OrderCancelledEvent, Subjects, Publisher } from '@rntickets/common';

export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
  readonly subject = Subjects.OrderCancelled;
}
