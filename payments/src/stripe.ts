// imports class
import Stripe from 'stripe';

// to make use of the stripe library, we have to make an instance out of that class
// entire purpose of this file is to create an instance of Stripe library and export it to be used elsewhere in project
export const stripe = new Stripe(process.env.STRIPE_KEY!, {
  apiVersion: '2020-08-27',
});
