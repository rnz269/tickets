import express, { Request, Response } from 'express';
import {
  requireAuth,
  NotFoundError,
  NotAuthorizedError,
} from '@rntickets/common';
import { Order, OrderStatus } from '../models/order';
import { natsWrapper } from '../nats-wrapper';
import { OrderCancelledPublisher } from '../events/publishers/order-cancelled-publisher';

const router = express.Router();

router.delete(
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

    // ensure order is cancellable: that it's either created or awaitingPayment
    order.status = OrderStatus.Cancelled;
    await order.save();

    // publish an event to indicate this order's status was changed to cancelled
    new OrderCancelledPublisher(natsWrapper.client).publish({
      id: order.id,
      version: order.version,
      ticket: {
        id: order.ticket.id,
      },
    });

    // DELETE request should send back a status code of 204
    res.status(204).send(order);
  }
);

export { router as deleteOrderRouter };
