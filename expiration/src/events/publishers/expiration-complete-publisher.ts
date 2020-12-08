import {
  Publisher,
  Subjects,
  ExpirationCompleteEvent,
} from '@rntickets/common';

export class ExpirationCompletePublisher extends Publisher<ExpirationCompleteEvent> {
  readonly subject = Subjects.ExpirationComplete;
}
