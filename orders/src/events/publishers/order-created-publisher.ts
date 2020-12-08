import { OrderCreatedEvent, Subjects, Publisher } from '@rntickets/common';

export class OrderCreatedPublisher extends Publisher<OrderCreatedEvent> {
  readonly subject = Subjects.OrderCreated;
}
