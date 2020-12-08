// to display a link w/ Nextjs, we don't just use an anchor tag a
// instead, we use custom component called Link
import Link from 'next/link';

export default function Header({ currentUser }) {
  // trick to show content based on single filtering criteria:
  const links = [
    !currentUser && { label: 'Sign Up', href: '/auth/signup' },
    !currentUser && { label: 'Sign In', href: '/auth/signin' },
    currentUser && { label: 'Sell Tickets', href: '/tickets/new' },
    currentUser && { label: 'My Orders', href: '/orders' },
    currentUser && { label: 'Sign Out', href: '/auth/signout' },
  ] // step 1
    .filter((linkConfig) => linkConfig) // step 2
    .map(({ label, href }) => {
      return (
        <li key={href} className="nav-item">
          <Link href={href}>
            <a className="nav-link">{label}</a>
          </Link>
        </li>
      );
    }); // step 3
  return (
    <nav className="navbar navbar-light bg-light">
      <Link href="/">
        <a className="navbar-brand">GitTix</a>
      </Link>
      <div className="d-flex justify-content-end">
        <ul className="nav d-flex align-items-center">{links}</ul>
      </div>
    </nav>
  );
}

/* 
Our trick to show content based on single filtering criteria
Suppose user is signed in. Then:
step 1: [false, false, {label: 'Sign Out', href: '/auth/signout'}]
step 2: remove falses: [{label: 'Sign Out', href: '/auth/signout'}]
step 3: generate jsx [<li key={'/auth/signout'}>Sign Out</li>]
*/
