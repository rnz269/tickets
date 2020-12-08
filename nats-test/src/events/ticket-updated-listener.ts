import { Message } from 'node-nats-streaming';
import { Listener } from './base-listener';
import { TicketUpdatedEvent } from './ticket-updated-event';
import { Subjects } from './subjects';

// boilerplate 41 lines is performed by Listener -- so this class specifies biz logic

// we want to supply a type arg that is the event we expect to listen for
// once we supply that, TS enforces association & type-checking
export class TicketUpdatedListener extends Listener<TicketUpdatedEvent> {
  // Listener base class requires subject to be of T['subject'], which is TCE.subject
  readonly subject = Subjects.TicketUpdated;
  queueGroupName = 'payments-service-queue-group';
  onMessage(data: TicketUpdatedEvent['data'], msg: Message) {
    // can run whatever biz logic we want - update something in db, for example
    console.log('Event data!', data);
    msg.ack();
  }
}
