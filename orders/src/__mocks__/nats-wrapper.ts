// fake implementation to not throw err on new TicketPublisher(natsWrapper.client) in new & update routes
export const natsWrapper = {
  client: {
    // we're mocking the definition of the publish fn, as base-publisher expects the cb it provides to be invoked upon success
    publish: jest
      .fn()
      .mockImplementation(
        (subject: string, data: string, callback: () => void) => {
          callback();
        }
      ),
  },
};
