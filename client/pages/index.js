import Link from 'next/link';

const LandingPage = ({ tickets }) => {
  const ticketList = tickets.map((ticket) => (
    <tr key={ticket.id}>
      <td>{ticket.title}</td>
      <td>{ticket.price}</td>
      <td>
        <Link href="/tickets/[ticketId]" as={`/tickets/${ticket.id}`}>
          <a className="nav-link">View</a>
        </Link>
      </td>
    </tr>
  ));
  return (
    <div>
      <h1>Tickets for Sale</h1>
      <table className="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Price</th>
            <th>Link</th>
          </tr>
        </thead>
        <tbody>{ticketList}</tbody>
      </table>
    </div>
  );
};

LandingPage.getInitialProps = async (context, client, currentUser) => {
  const response = await client.get('/api/tickets');
  return { tickets: response.data };
};

export default LandingPage;

/*
My version
  const ticketComponents = tickets.map((ticket) => (
    <li key={ticket.id}>
      <a href={`/tickets/${ticket.id}`}>
        {`${ticket.title} - $${ticket.price}`}
      </a>
    </li>
  ));
  return (
    <div>
      <h1>Tickets for Sale</h1>
      <ul className="my-0">{ticketComponents}</ul>
    </div>
  );
};
*/
