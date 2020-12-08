import { Message, Stan } from 'node-nats-streaming';
import { Subjects } from './subjects';

// for an object to be considered an Event, it must have a subject property that's one of the properties listed in enum
interface Event {
  subject: Subjects;
  data: any;
}

// whenever we try to extend Listener, we have to provide a custom type to it as an arg
// we can now refer to type T everywhere inside this class definition
// this abstract class is an incomplete blueprint. subclassing it provides complete blueprint.
export abstract class Listener<T extends Event> {
  abstract subject: T['subject'];
  abstract queueGroupName: string;
  // onMessage is the only business logic -- what to do on receiving event
  abstract onMessage(data: T['data'], msg: Message): void;

  private client: Stan; // will receive preinitialized client (already connected to NSS) as an argument to constructor
  protected ackWait = 5 * 1000; // protected indicates subclass can define it if it wants to

  constructor(client: Stan) {
    this.client = client;
  }
  // subject, queueGroupName, client, ackWait defined on instance
  // constructor & onMessage defined on subclass.prototype
  // subscriptionOptions, parseMessage, listen functions defined on Listener.prototype
  // reason why we can't set client outside of constructor is the client connection will be different,
  // provided by user. subject, queueGroupName, ackwait will be static whenever we use tick-created-listener
  subscriptionOptions() {
    return this.client
      .subscriptionOptions()
      .setDeliverAllAvailable()
      .setManualAckMode(true)
      .setAckWait(this.ackWait) // customize acknowledgement timeout period from 30s to 5s
      .setDurableName(this.queueGroupName); // rarely will you want a different durable name than simply queueGroupName
  }

  parseMessage(msg: Message) {
    const data = msg.getData();
    return typeof data === 'string'
      ? JSON.parse(data)
      : JSON.parse(data.toString('utf8')); // we don't expect to receive a buffer, but this is how we would parse a buffer
  }

  listen() {
    // create subscription
    const subscription = this.client.subscribe(
      this.subject,
      this.queueGroupName,
      this.subscriptionOptions()
    );
    // on receiving an event
    subscription.on('message', (msg: Message) => {
      console.log(`Message received: ${this.subject} / ${this.queueGroupName}`);
      // parse data
      const parsedData = this.parseMessage(msg);
      // process event
      this.onMessage(parsedData, msg); // don't know what we want to do inside of onMessage yet, so we'll pass msg just in case
    });
  }
}
