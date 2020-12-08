// https://github.com/vercel/next.js/blob/master/errors/css-global.md
import 'bootstrap/dist/css/bootstrap.css';
import buildClient from '../api/build-client';
import Header from '../components/header';

/*
we want css on every page -- thus, we're importing global css into our nextjs project
We can only import global css in this _app.js file

The following function works like this:
When a user visits a page in our nextjs app, nextjs will import relevant page component
But next doesn't just show this page -- rather, it wraps it inside its own custom
default component referred to as app. we defined _app so that nextjs passes relevant page
to this component as the Component prop. pageProps are the set of props we want to pass
to the page components.

This is the only file we're guaranteed to load up no matter which route user visits
Whereas, if user visits banana route, next won't parse index, so any css in index is moot
*/

const AppComponent = ({ Component, pageProps, currentUser }) => {
  return (
    <div>
      <Header currentUser={currentUser} />
      <div className="container">
        <Component currentUser={currentUser} {...pageProps} />
      </div>
    </div>
  );
};

AppComponent.getInitialProps = async (appContext) => {
  // fetch some data on the current user
  const client = buildClient(appContext.ctx);
  const { data } = await client.get('/api/users/currentuser');

  let pageProps = {};
  // manually invoke the component's getInitialProps IF the component has defined it
  if (appContext.Component.getInitialProps) {
    pageProps = await appContext.Component.getInitialProps(
      appContext.ctx,
      client,
      data.currentUser
    );
  }

  return {
    pageProps,
    currentUser: data.currentUser,
  };
};

export default AppComponent;
