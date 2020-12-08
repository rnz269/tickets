import nats, { Stan } from 'node-nats-streaming';

class NatsWrapper {
  // _client type is undef or Stan - if we omitted field, TS error in connect when setting this._client
  private _client?: Stan;

  // optional: we're using a getter to govern access to _client, as it provides specific err msg when
  // accessed before property is defined
  get client() {
    if (!this._client) {
      throw new Error('Cannot access NATS client before connecting');
    }
    return this._client;
  }

  connect(clusterId: string, clientId: string, url: string) {
    // next line defines natsWrapper._client, so now getter provides access
    this._client = nats.connect(clusterId, clientId, { url });
    return new Promise<void>((resolve, reject) => {
      this.client.on('connect', () => {
        console.log('Connected to NATS');
        resolve();
      });
      this.client.on('error', (err) => {
        reject(err);
      });
    });
  }
}

// want to export a pre-initialized singleton which has capability of storing a connection internally,
// but allows index.ts to initialize connection
export const natsWrapper = new NatsWrapper();

/* 
exported natsWrapper object is empty, but it's proto-linked to NatsWrapper.prototype
NatsWrapper.prototype has:
1. constructor property pointing back at NatsWrapper class function
2. connect method
3. client (getter)

Initially natsWrapper object doesn't have a _client property -- it's a type. When compile to JS => no code 
This is why we say on line 32 that natsWrapper object is empty.
After connect method is called, the natsWrapper object has a _client property.
 

think more about how we were able to make node-nats-streaming into a singleton

console.log(
  'constructed natsWrapper object property descriptor:',
  Object.getOwnPropertyDescriptors(natsWrapper)
);
console.log(
  'NatsWrapper.prototype property descriptor:',
  Object.getOwnPropertyDescriptors(NatsWrapper.prototype)
); // getters show up with PropertyDescriptors function
console.log('NatsWrapper.prototype', NatsWrapper.prototype); // getters don't show up
*/
