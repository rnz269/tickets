// issue 1: properties we pass to Ticket constructor aren't checked by TS
// issue 2: properties avail on indiv. ticket doc may not match those passed to constructor
import mongoose from 'mongoose';
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';

// describes the properties required to create a new ticket: issue 1
interface TicketAttrs {
  title: string;
  price: number;
  userId: string;
}

//describes the properties that a Ticket Model has: issue 1
// TicketModel interface extends mongoose.Model, and represents a collection of TicketDocs
interface TicketModel extends mongoose.Model<TicketDoc> {
  build(attrs: TicketAttrs): TicketDoc; // return value of build method must be type TicketDoc
}

// describes the properties that a Ticket Document has: solves issue 2
interface TicketDoc extends mongoose.Document {
  title: string;
  price: number;
  userId: string;
  orderId: string;
  // extra property added by mongoose
  version: number;
}

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String, // actual value type, used by mongoose, referring to JS built-in String constructor
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    orderId: {
      type: String,
    },
  },
  // second argument: options object of type mongoose.SchemaOptions
  // overrides built-in stringify method. we mutate ret, which starts off as copy of doc
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

// to create new ticket, call Ticket.build(..) instead of default constructor new Ticket(..)
// allows TS to check the argument, as mongoose prevents TS from doing so
// Must add build method to TicketModel interface for TS to recognize it
ticketSchema.static('build', (attrs: TicketAttrs) => {
  return new Ticket(attrs);
});

/*
// old way to declare new method on model
ticketSchema.statics.build = function (attrs: TicketAttrs) {
  return new Ticket(attrs);
};
*/

// mongoose creates a model out of schema. model is the CRUD interface to reach MongoDB
// we give model constructor template vars TicketDoc and TicketModel, it returns type TicketModel, which represents a collection of TicketDocs
// Now, Ticket: TicketModel, so we can use build method on it
const Ticket = mongoose.model<TicketDoc, TicketModel>('Ticket', ticketSchema);

export { Ticket };
