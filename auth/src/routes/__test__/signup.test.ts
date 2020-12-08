// allows us to fake a request to the express app
import request from 'supertest';
import { app } from '../../app';

// send POST req. to /signup with body email and pass, and get some response w/ 201 status
it('returns a 201 on successful signup', async () => {
  // #1. request(app) calls supertest function, returning SuperTest<Test>
  // #2. SuperTest<Test> extends SuperAgent<Test> which has get & post methods, returning Test
  // #3. Test extends SuperAgentRequest, which extends Request, which has send method returning Test
  // #4. Test has expect method taking in a status code and returning a Test which eventually resolves
  // Test extends Request extends Promise<Response>, meaning Test is a promise that fulfills with access
  // to Response properties & methods, like get('Set-Cookie') or access properties like status or body
  // step 1 is sync, then every step returns a Test, which extends Request which extends Promise
  return request(app) // #1 returns SuperTest
    .post('/api/users/signup') // #2 returns Test
    .send({
      email: 'test@test.com',
      password: 'password',
    }) // #3 returns Test
    .expect(201); // #4 returns Test
});

it('returns a 400 on invalid email', async () => {
  return request(app)
    .post('/api/users/signup')
    .send({
      email: 'test',
      password: 'password',
    })
    .expect(400);
});

it('returns a 400 on invalid password', async () => {
  return request(app)
    .post('/api/users/signup')
    .send({
      email: 'test@gmail.com',
      password: 'p',
    })
    .expect(400);
});

// this is one test, but it must pass both subcomponents (return 400, then return 400)
it('returns a 400 w/ missing email and password', async () => {
  await request(app)
    .post('/api/users/signup')
    .send({ email: 'test@test.com' })
    .expect(400);
  return request(app)
    .post('/api/users/signup')
    .send({ password: 'aljdks' })
    .expect(400);
});

// this is one test, but it must pass both subcomponents (return 201, then return 400)
it('disallows duplicate emails', async () => {
  await request(app)
    .post('/api/users/signup')
    .send({
      email: 'test@gmail.com',
      password: 'password',
    })
    .expect(201);
  return request(app)
    .post('/api/users/signup')
    .send({ password: 'aljkds' })
    .expect(400);
});

// LEARNED: supertest doesn't make https requests. it makes http requests.
// we should change our cookieSession secure property to false IF in test env
it('sets a cookie after successful signup', async () => {
  // grab response object, make sure it has a cookie header on it
  const response = await request(app)
    .post('/api/users/signup')
    .send({
      email: 'test@gmail.com',
      password: 'password',
    })
    .expect(201);

  // response is actual response object -- its get method allows inspection of headers
  // get is a supertest method that returns a promise of type string[]
  // IMPORTANT - expect takes one argument: the value to apply matchers against
  // matchers are .toBeDefined or toEqual
  expect(response.get('Set-Cookie')).toBeDefined();
});
