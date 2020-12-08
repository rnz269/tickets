import mongoose from 'mongoose';
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';
import { Order, OrderStatus } from './order';

interface TicketAttrs {
  id: string;
  title: string;
  price: number;
}

// mongoose.Document interface defines _id
interface TicketDoc extends mongoose.Document {
  title: string;
  price: number;
  // added properties not on TicketAttrs
  version: number;
  isReserved(): Promise<boolean>;
}

interface TicketModel extends mongoose.Model<TicketDoc> {
  build(attrs: TicketAttrs): TicketDoc;
  findByEvent(event: {
    id: string;
    version: number;
  }): Promise<TicketDoc | null>;
}

// now, let's build out our schema to describe an instance of an ticket
// that is, an ticket's different properties & rules about them
const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  // second argument: options obj of type mongoose.SchemaOptions
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

// tell mongoose we want to track version using field version, rather than __v
ticketSchema.set('versionKey', 'version');
ticketSchema.plugin(updateIfCurrentPlugin);

// will give us the query method on the actual ticket model
ticketSchema.static(
  'findByEvent',
  function (event: { id: string; version: number }) {
    return Ticket.findOne({
      _id: event.id,
      version: event.version - 1,
    });
  }
);

// will give us the build method on the actual ticket model
ticketSchema.static('build', (attrs: TicketAttrs) => {
  return new Ticket({
    _id: attrs.id,
    title: attrs.title,
    price: attrs.price,
  });
});

// will give us the isReserved method on each instance of a TicketDoc
// isReserved method checks whether a TicketDoc is currently reserved by a user
ticketSchema.method('isReserved', async function (this: TicketDoc) {
  const existingOrder = await Order.findOne({
    ticket: this,
    status: {
      $in: [
        OrderStatus.Created,
        OrderStatus.AwaitingPayment,
        OrderStatus.Complete,
      ],
    },
  });
  return !!existingOrder;
});

// define our actual model
// 'Ticket' refers to the name of the collection
const Ticket = mongoose.model<TicketDoc, TicketModel>('Ticket', ticketSchema);

export { Ticket, TicketDoc };
