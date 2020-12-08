/* we'll send back a header that will tell user's browser to dump all the info inside
cookie, which will remove JWT, so that subsequent user requests will have no JWT
*/
import express from 'express';

const router = express.Router();

router.post('/api/users/signout', (req, res) => {
  // cookieSession library dictates to destroy a session, simply set session to null
  req.session = null;
  res.send({});
});

export { router as signoutRouter };
