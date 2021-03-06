import express from 'express'; // module factory function
import 'express-async-errors';
import { json } from 'body-parser'; // json module factory function
import cookieSession from 'cookie-session'; // module factory function
import { errorHandler, NotFoundError, currentUser } from '@rntickets/common';

import { newOrderRouter } from './routes/new';
import { showOrderRouter } from './routes/show';
import { indexOrderRouter } from './routes/index';
import { deleteOrderRouter } from './routes/delete';

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
    secure: false, // process.env.NODE_ENV !== 'test', // (jest auto-sets NODE_ENV to test) cookies only used if user visiting our app over https connection
  })
);
app.use(currentUser);

app.use(newOrderRouter);
app.use(showOrderRouter);
app.use(indexOrderRouter);
app.use(deleteOrderRouter);

// 'express-async-errors' library allows express to auto-handle async errors (rather than require manual next(e) call)
app.all('*', async () => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };
