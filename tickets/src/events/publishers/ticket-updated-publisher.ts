import { Publisher, TicketUpdatedEvent, Subjects } from '@rntickets/common';

export class TicketUpdatedPublisher extends Publisher<TicketUpdatedEvent> {
  readonly subject = Subjects.TicketUpdated;
}
