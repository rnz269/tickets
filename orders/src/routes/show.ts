import express, { Request, Response } from 'express';
import {
  NotAuthorizedError,
  NotFoundError,
  requireAuth,
} from '@rntickets/common';
import { Order } from '../models/order';

const router = express.Router();

router.get(
  '/api/orders/:orderId',
  requireAuth,
  async (req: Request, res: Response) => {
    // could have added a validation step to ensure orderId matches structure of a mongoId

    // fetch order specified in route
    const order = await Order.findById(req.params.orderId).populate('ticket');

    // ensure order exists
    if (!order) {
      throw new NotFoundError();
    }

    // ensure current user owns the order
    if (order.userId !== req.currentUser!.id) {
      throw new NotAuthorizedError();
    }

    res.send(order);
  }
);

export { router as showOrderRouter };
