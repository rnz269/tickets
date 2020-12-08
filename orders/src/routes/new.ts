import mongoose, { version } from 'mongoose';
import express, { Request, Response } from 'express';
import {
  NotFoundError,
  requireAuth,
  validateRequest,
  OrderStatus,
  BadRequestError,
} from '@rntickets/common';
import { body } from 'express-validator';
import { Order } from '../models/order';
import { Ticket } from '../models/ticket';
import { natsWrapper } from '../nats-wrapper';
import { OrderCreatedPublisher } from '../events/publishers/order-created-publisher';

const router = express.Router();

const EXPIRATION_WINDOW_SECONDS = 60;

router.post(
  '/api/orders',
  requireAuth,
  [
    body('ticketId')
      .not()
      .isEmpty()
      .custom((input: string) => mongoose.Types.ObjectId.isValid(input))
      .withMessage('TicketId must be provided'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { ticketId } = req.body;

    // 1) Find the ticket the user is trying to order in db. If fail, throw error.
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      throw new NotFoundError();
    }

    // 2) Make sure this ticket is not already reserved by someone else
    const isReserved = await ticket.isReserved();
    if (isReserved) {
      throw new BadRequestError('Ticket is already reserved');
    }

    // 3) Calculate an expiration date for this order, 15 minutes from now
    const expiration = new Date();
    // returned obj has time value of now. to point it 15 min in future:
    expiration.setSeconds(expiration.getSeconds() + EXPIRATION_WINDOW_SECONDS);

    // 4) Build order and save it to db
    const order = Order.build({
      userId: req.currentUser!.id,
      status: OrderStatus.Created,
      expiresAt: expiration,
      ticket,
    });
    await order.save();

    // 5) Publish an event to indicate an order has been created
    await new OrderCreatedPublisher(natsWrapper.client).publish({
      id: order.id,
      version: order.version,
      status: order.status,
      userId: order.userId,
      expiresAt: order.expiresAt.toISOString(), // convert from date to string
      ticket: {
        id: ticket.id,
        price: ticket.price,
      },
    });

    // 6) Send a response
    res.status(201).send(order);
  }
);

export { router as newOrderRouter };
