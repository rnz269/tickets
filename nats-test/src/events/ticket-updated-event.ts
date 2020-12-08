import { Subjects } from './subjects';

// sets up association between ticket:created and {id, title, price}
// this coupling is enforced in Listener & TicketCreatedListener
export interface TicketUpdatedEvent {
  subject: Subjects.TicketUpdated;
  data: {
    id: string;
    title: string;
    price: number;
  };
}
