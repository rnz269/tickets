import express from 'express'; // module factory function
import 'express-async-errors';
import { json } from 'body-parser'; // json module factory function
import cookieSession from 'cookie-session'; // module factory function

import { currentUserRouter } from './routes/current-user';
import { signinRouter } from './routes/signin';
import { signoutRouter } from './routes/signout';
import { signupRouter } from './routes/signup';
import { errorHandler, NotFoundError } from '@rntickets/common';

/*****  Creates and Configures Express Application *****/
const app = express();
// express sees traffic is being proxied to our app through ingress-nginx, defaults to distrusting https connection
// trust traffic as secured even though it's coming from the proxy
app.set('trust proxy', true);
// json() returns middleware jsonParser()
app.use(json());
app.use(
  cookieSession({
    signed: false, // disable encryption on cookie, since jwt is encrypted
    secure: process.env.NODE_ENV !== 'test', // (jest auto-sets NODE_ENV to test) cookies only used if user visiting our app over https connection
  })
);

app.use(currentUserRouter);
app.use(signinRouter);
app.use(signoutRouter);
app.use(signupRouter);

// 'express-async-errors' library allows express to auto-handle async errors (rather than require manual next(e) call)
app.all('*', async () => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };
