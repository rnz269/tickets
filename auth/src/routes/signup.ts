import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
// body is a mw function that checks req.body & appends error info to req
// validationResult is a func that pulls validation error info off req
import { body } from 'express-validator';
import { BadRequestError, validateRequest } from '@rntickets/common';
import { User } from '../models/user';

const router = express.Router();

router.post(
  '/api/users/signup',
  [
    body('email').isEmail().withMessage('Email must be valid'), // produces err msg if isEmail returns false
    body('password')
      .trim() // sanitization step
      .isLength({ min: 4, max: 20 })
      .withMessage('Password must be between 4 and 20 characters'),
  ],
  validateRequest, // process errors appended by validator middleware
  async (req: Request, res: Response) => {
    const { email, password } = req.body;
    // STEP 1: ensure user doesn't already exist in db
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new BadRequestError('Email address already in use');
    }

    // STEP 3: since user doesn't exist, create new user document and save them to db
    const user = User.build({ email, password });
    await user.save(); // STEP 2: behind scenes, mongoose hashes pw before saving to db (check user model)

    // STEP 4: User now logged in - send them a cookie/JWT for auth in future requests
    // generate JWT
    const userJwt = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_KEY!
    );

    // store created JWT in cookie
    req.session = { jwt: userJwt };

    // send method returns json data (calls toJSON on obj). Response includes cookie.
    res.status(201).send(user);
  }
);

export { router as signupRouter };
