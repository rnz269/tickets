import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../app';
import jwt from 'jsonwebtoken';

// tell ts there's a global property: global.signin
// alternatively, to not pollute global namespace, we can put function in separate file
// and simply import it into each test file. we did this to avoid repetitious import.
declare global {
  namespace NodeJS {
    interface Global {
      signin(id?: string): string[];
    }
  }
}

// import statement to tell jest to use our mock nats-wrapper file
jest.mock('../nats-wrapper');

let mongo: any;

// Uncomment in Approach 1: real version
// Shortcut: make stripe key available as an environment variable in our test environment
process.env.STRIPE_KEY =
  'sk_test_51Hv50IHyADH4ddLQw7XaUn11ssd5vTWbZ4q2SRUPm4QXvgAnTKSICkOCsEeCKlWgXbHznb2NJdGssQWgoFFIPleN00NCX1WIkI';

// hook function -- runs before all of our tests are executed
beforeAll(async () => {
  process.env.JWT_KEY = 'asdfasdf'; // setup env variable for test env

  mongo = new MongoMemoryServer();
  const mongoUri = await mongo.getUri();

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// hook function -- runs before each of our tests
beforeEach(async () => {
  // reset mocks data between tests (# of times mock fn called, etc.)
  jest.clearAllMocks();
  const collections = await mongoose.connection.db.collections();
  for (let collection of collections) {
    await collection.deleteMany({});
  }
});

// hook function -- runs after finishing tests, stops mongodb memory server
afterAll(async () => {
  await mongo.stop();
  await mongoose.connection.close();
});

global.signin = (id?: string) => {
  // Build a JWT payload: { id, email }
  const payload = {
    id: id || new mongoose.Types.ObjectId().toHexString(),
    email: `test@test.com`,
  };

  // Create the JWT, MY_JWT, by passing in the payload and the secret key (which is defined in this file inside beforeAll)
  const MY_JWT = jwt.sign(payload, process.env.JWT_KEY!);

  // Build session object: { jwt: MY_JWT }
  const session = { jwt: MY_JWT };

  // Serialization step 1: Turn that session object into JSON
  const sessionJSON = JSON.stringify(session);

  // Serialization step 2: Take JSON and encode it as base64
  // how we turn a string into base64 in Nodejs
  const sessionBase64 = Buffer.from(sessionJSON).toString('base64');

  // return a string that looks like above by taking output of previous step & setting after = in following: cookie: express:sess=eyJqd3Qi0mmasdfasdflksjasdf
  return [`express:sess=${sessionBase64}`];
};
