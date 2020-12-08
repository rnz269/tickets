import express, { Request, Response } from 'express';
import { requireAuth } from '@rntickets/common';
import { Order } from '../models/order';

const router = express.Router();

router.get('/api/orders', requireAuth, async (req: Request, res: Response) => {
  // retrieve all active orders for the given user making the request
  // for each order, will want to also include the ticket that the order is for
  const orders = await Order.find({
    userId: req.currentUser!.id,
  }).populate('ticket');

  res.send(orders);
});

export { router as indexOrderRouter };
