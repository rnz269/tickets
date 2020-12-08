import request from 'supertest';
import { app } from '../../app';

// last test: if not logged in, return null
it('responds with null if not authenticated', async () => {
  const response = await request(app)
    .get('/api/users/currentuser')
    .send()
    .expect(200);

  expect(response.body.currentUser).toEqual(null);
});

// Solution 2: Reusable and Efficient
// we'll build a helper function that signs up for account and makes follow-up request
// using that account's cookie
it('get currentUser when signed in', async () => {
  const cookie = await global.signin();
  const response = await request(app)
    .get('/api/users/currentuser')
    .set('Cookie', cookie) // .set method sets header on request. setting w/ cookie.
    .send()
    .expect(200);

  expect(response.body.currentUser.email).toEqual('test@test.com');
});

/*
// Solution 1: quick & dirty
Ultimately, decided we don't want to use this approach. We'll go with something
far more reusable.

it('get currentUser when signed in', async () => {
  const authResponse = await request(app)
    .post('/api/users/signup')
    .send({
      email: 'test@test.com',
      password: 'password',
    })
    .expect(201);

  const cookie = authResponse.get('Set-Cookie'); // capture cookie in variable

  const response = await request(app)
    .get('/api/users/currentuser')
    .set('Cookie', cookie) // .set method sets header on request. setting w/ cookie.
    .send()
    .expect(200);

  expect(response.body.currentUser.email).toEqual('test@test.com');
});
*/

/* Discovering problem
it('get currentUser when signed in', async () => {
  await request(app)
    .post('/api/users/signup')
    .send({
      email: 'test@test.com',
      password: 'password',
    })
    .expect(201);

  const response = await request(app)
    .get('/api/users/currentuser')
    .send()
    .expect(200);

  console.log(response.body);
});
  // we expected to see {currentUser: {id: 'asdf', email: 'test@test.com' }}
  // we actually see {currentUser: null}, because supertest doesn't automatically
  // attach the cookie on follow-up requests like browser and Postman do
  // so, supertest doesn't automatically attach cookie on follow-up request
  // we must ensure we come up with a solution to signup, take a cookie from first
  // request, and make it easy to include that cookie in follow-up requests
*/
