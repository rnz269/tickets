import mongoose from 'mongoose';
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';
import { OrderStatus } from '@rntickets/common';

interface OrderAttrs {
  id: string;
  userId: string;
  status: OrderStatus;
  price: number;
}

// recall, mongoose.Document interface defines _id
interface OrderDoc extends mongoose.Document {
  userId: string;
  status: OrderStatus;
  price: number;
  // version doesn't matter that much for order, as there's no OrderUpdateEvent, but will include anyways
  // every resource that is consumed should generaly be versioned, to be safe
  version: number;
}

interface OrderModel extends mongoose.Model<OrderDoc> {
  build(attrs: OrderAttrs): OrderDoc;
  findByEvent(event: { id: string; version: number }): Promise<OrderDoc | null>;
}

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(OrderStatus), // not necessary, as interfaces should take care
    },
    price: {
      type: Number,
      required: true,
    },
  },
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
orderSchema.set('versionKey', 'version');
// plug in auto-version-increment module
orderSchema.plugin(updateIfCurrentPlugin);

// when consumer of replicated, versioned data must query the replicated data, we must have a findByEvent method
orderSchema.static('findByEvent', (event: { id: string; version: number }) => {
  return Order.findOne({
    _id: event.id,
    version: event.version - 1,
  });
});

orderSchema.static('build', (attrs: OrderAttrs) => {
  return new Order({
    _id: attrs.id,
    status: attrs.status,
    userId: attrs.userId,
    price: attrs.price,
  });
});

const Order = mongoose.model<OrderDoc, OrderModel>('Order', orderSchema);

export { Order, OrderDoc };
