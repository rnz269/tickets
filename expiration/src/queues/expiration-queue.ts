import Queue from 'bull'; // a generic class we can use to create a queue instance
import { ExpirationCompletePublisher } from '../events/publishers/expiration-complete-publisher';
import { natsWrapper } from '../nats-wrapper';

// describes data to be held inside job
interface Payload {
  orderId: string;
}

// 1) create an instance of the queue, which is what will allow us to publish job and process job
const expirationQueue = new Queue<Payload>('order:expiration', {
  redis: { host: process.env.REDIS_HOST },
});

// 2) process job once received from redis-server
expirationQueue.process(async (job) => {
  await new ExpirationCompletePublisher(natsWrapper.client).publish({
    orderId: job.data.orderId,
  });
});

// 3) export queue to use elsewhere in project
export { expirationQueue };
