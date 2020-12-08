import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import {
  requireAuth,
  validateRequest,
  BadRequestError,
  NotFoundError,
  NotAuthorizedError,
  OrderStatus,
} from '@rntickets/common';
import { stripe } from '../stripe';
import { Order } from '../models/order';
import { Payment } from '../models/payment';
import { PaymentCreatedPublisher } from '../events/publishers/payment-created-publisher';
import { natsWrapper } from '../nats-wrapper';

const router = express.Router();

router.post(
  '/api/payments',
  requireAuth,
  [body('token').not().isEmpty(), body('orderId').not().isEmpty()],
  validateRequest,
  async (req: Request, res: Response) => {
    const { token, orderId } = req.body;

    // find the relevant order
    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError();
    }

    // ensure the user owns the order
    if (order.userId !== req.currentUser!.id) {
      throw new NotAuthorizedError();
    }

    // ensure the order does not have status of cancelled
    if (order.status === OrderStatus.Cancelled) {
      throw new BadRequestError('Cannot pay for a cancelled order');
    }

    // with validation and verification complete, charge user
    const charge = await stripe.charges.create({
      amount: order.price * 100,
      currency: 'usd',
      source: token,
    });

    const payment = Payment.build({
      orderId: order.id,
      stripeId: charge.id,
    });

    await payment.save();

    // publish payment:created event, to be received by orders service, which should update its order status to complete
    new PaymentCreatedPublisher(natsWrapper.client).publish({
      id: payment._id,
      orderId: payment.orderId,
      stripeId: payment.stripeId,
    });

    res.status(201).send({ id: payment._id });
  }
);

export { router as createChargeRouter };
