import mongoose from 'mongoose';
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';
import { OrderStatus } from '@rntickets/common';
import { TicketDoc } from './ticket';

interface OrderAttrs {
  userId: string;
  status: OrderStatus;
  expiresAt: Date;
  ticket: TicketDoc;
}

interface OrderDoc extends mongoose.Document {
  userId: string;
  status: OrderStatus;
  expiresAt: Date;
  ticket: TicketDoc;
  version: number;
}

interface OrderModel extends mongoose.Model<OrderDoc> {
  build(attrs: OrderAttrs): OrderDoc;
}

// now, let's build out our schema to describe an instance of an order
// that is, an order's different properties & rules about them

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    // status: awaitingPayment, cancelled, purchased, etc.
    status: {
      type: String,
      required: true,
      enum: Object.values(OrderStatus), // not necessary, as interfaces should take care
      default: OrderStatus.Created, // not necessary, since we have multiple checks
    },
    // when user pays for an order, it should be saved forever => expiration not a required property
    // notice, we specify date object, not string. when publishing event, we convert to string
    expiresAt: {
      type: mongoose.Schema.Types.Date,
    },
    // how we'll set up our actual reference between Order document and Ticket document
    // we'll get a deep dive on the ref system later
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
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

// rename version key from _v to version
orderSchema.set('versionKey', 'version');
// use versioning plugin
orderSchema.plugin(updateIfCurrentPlugin);

// will give us the build method on the actual order model
orderSchema.static('build', (attrs: OrderAttrs) => {
  return new Order(attrs);
});

// define our actual model
// 'Order' refers to the name of the collection
const Order = mongoose.model<OrderDoc, OrderModel>('Order', orderSchema);

export { Order, OrderStatus };
