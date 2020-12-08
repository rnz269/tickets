import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../app';

// tell ts there's a global property: global.signin
// alternatively, to not pollute global namespace, we can put function in separate file
// and simply import it into each test file. we did this to avoid repetitious import.
declare global {
  namespace NodeJS {
    interface Global {
      signin(): Promise<string[]>; // promise will resolve with array of strings
    }
  }
}

let mongo: any;

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

global.signin = async () => {
  const email = 'test@test.com';
  const password = 'password';

  const response = await request(app)
    .post('/api/users/signup')
    .send({
      email,
      password,
    })
    .expect(201);

  const cookie = response.get('Set-Cookie');
  return cookie;
};
