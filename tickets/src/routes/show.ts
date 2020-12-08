import { NotFoundError } from '@rntickets/common';
import express, { Request, Response } from 'express';
import { Ticket } from '../models/ticket';

const router = express.Router();

router.get('/api/tickets/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  // findById returns either a ticket document or null
  const ticket = await Ticket.findById(id);
  if (!ticket) {
    throw new NotFoundError();
  }
  // if we leave of status code, defaults to 200
  res.send(ticket);
});

export { router as showTicketRouter };
