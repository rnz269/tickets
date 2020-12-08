import { Ticket } from '../ticket';

// SIMPLY TESTING THAT OUR TICKET MODEL IMPLEMENTS OPTIMISTIC CONCURRENCY

it('implements optimistic concurrency control', async (done) => {
  // Create an instance of a ticket
  const ticket = Ticket.build({
    title: 'concert',
    price: 5,
    userId: '123',
  });
  // Save the ticket to the database. Plugin assigns version property to it (0)
  await ticket.save();
  // Fetch the ticket twice, so we have 2 separate in-code document representations
  // of ticket, and they'll each have the default version (suppose it's 0)
  const firstInstance = await Ticket.findById(ticket.id);
  const secondInstance = await Ticket.findById(ticket.id);

  // Make two separate changes to the tickets we fetched
  firstInstance!.set({ price: 10 });
  secondInstance!.set({ price: 15 });

  // Save the first fetched ticket to DB (mongoose will ask DB for corresponding id w/ version 0, increment to 1)
  await firstInstance!.save();

  // Save the second fetched ticket to DB (mongoose will ask DB for corresponding id w/ version 0, increment to 1)
  // as this record doesn't exist in DB, we'll expect an error

  // Set up expectation: if OCC implemented correctly, catch block executed, returning from test
  try {
    await secondInstance!.save();
  } catch (err) {
    return done();
  }
  // if OCC implemented incorrectly, try {..} will succeed in overwriting, and we reach here
  throw new Error(
    'Test should not reach this point if OCC implemented correctly'
  );
});

it('ensures version number gets incremented by 1 on saves', async () => {
  // Create an instance of the ticket
  const ticket = Ticket.build({
    title: 'concert',
    price: 50,
    userId: '123',
  });

  // Save the ticket to the database
  await ticket.save();
  expect(ticket.version).toEqual(0);

  // we don't even have to make an update -- any time we save record, version increments
  await ticket.save();
  expect(ticket.version).toEqual(1);

  await ticket.save();
  expect(ticket.version).toEqual(2);
});
