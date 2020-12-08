import { Publisher, Subjects, PaymentCreatedEvent } from '@rntickets/common';

export class PaymentCreatedPublisher extends Publisher<PaymentCreatedEvent> {
  readonly subject = Subjects.PaymentCreated;
}
