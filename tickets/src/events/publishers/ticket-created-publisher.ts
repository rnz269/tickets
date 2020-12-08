import { Publisher, TicketCreatedEvent, Subjects } from '@rntickets/common';

// emits a TicketCreatedEvent to NSS
export class TicketCreatedPublisher extends Publisher<TicketCreatedEvent> {
  readonly subject = Subjects.TicketCreated;
}
