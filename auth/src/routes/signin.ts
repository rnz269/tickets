import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import jwt from 'jsonwebtoken';

import { BadRequestError, validateRequest } from '@rntickets/common';
import { User } from '../models/user';
import { Password } from '../services/password';

const router = express.Router();

router.post(
  '/api/users/signin',
  [
    body('email').isEmail().withMessage('Email must be valid'), // produces err msg if isEmail returns false
    body('password')
      .trim() // sanitization step
      .notEmpty()
      .withMessage('Password must not be empty'),
  ],
  validateRequest, // // STEP 0: process errors appended by validator middleware
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // STEP 1: Check if user with this email exists
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      throw new BadRequestError('Invalid credentials');
    }

    // STEP 2: Compare the stored user password with the supplied password
    const matchPassword = await Password.compare(
      existingUser.password,
      password
    );
    if (!matchPassword) {
      throw new BadRequestError('Invalid credentials');
    }

    // STEP 3: user now logged in - send them a cookie/JWT for auth in future requests
    // generate JWT
    const userJwt = jwt.sign(
      {
        id: existingUser.id,
        email: existingUser.email,
      },
      process.env.JWT_KEY!
    );

    // store created JWT in cookie
    req.session = { jwt: userJwt };

    res.status(200).send(existingUser);
  }
);

export { router as signinRouter };
