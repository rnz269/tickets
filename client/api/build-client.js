import axios from 'axios';

/* 
  - returns a preconfigured version of axios
  - preconfigured version will be like a normal axios client w/ baseurl and headers
  already specified
  (e.g. we import this & use: await buildClient(context).get(path))
*/

export default function buildClient({ req }) {
  if (typeof window === 'undefined') {
    // we're on the server, so requests should be made to long url
    return axios.create({
      baseURL:
        'http://ingress-nginx-controller.ingress-nginx.svc.cluster.local',
      headers: req.headers,
    });
  } else {
    // we're on the browser, so requests can omit base url
    return axios.create({
      baseUrl: '/',
    });
  }
}

/*
old version: 
issue with this was we hardcoded route, duh
could have taken route as argument, but instead of appending route and such here,
decided above version is easier: just use it like a normal axios client

import axios from 'axios';

const buildClient = async (req) => {
  if (typeof window === 'undefined') {
    // we're on the server, so requests should be made to long url
    const {data} = await axios.get(
      'http://ingress-nginx-controller.ingress-nginx.svc.cluster.local/api/users/currentuser',
      { headers: req.headers }
    );
    return data;
  } else {
    // we're on the browser, so requests can omit base url
    const { data } = await axios.get('/api/users/currentuser');
    return data;
  }
};

export { buildClient };
*/
