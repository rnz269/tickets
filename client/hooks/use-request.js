import { useState } from 'react';
import axios from 'axios';

/*** 
useRequest returns a) a fn that when invoked, makes an https request & b) formatted error jsx
This hook will be used wherever we need to make a request, & process response data/display errors
***/

export default function useRequest({ url, method, body, onSuccess }) {
  // store error message jsx in state
  const [errors, setErrors] = useState(null);

  async function doRequest(props = {}) {
    /* request goes to ingress-nginx controller, which routes to appropriate clusterip,
    which routes to pod whose container is running auth microservice app. The express
    app matches request to appropriate route, performs backend logic & responds. */
    try {
      // reset errors' state before next request
      setErrors(null);
      // axios[method] specifies a lookup on axios object using method var
      const response = await axios[method](url, {
        ...body,
        ...props,
      });
      // if onSuccess arg was provided, call it
      if (onSuccess) {
        onSuccess(response.data);
      }
      return response.data;
    } catch (err) {
      // capture errors from response
      const errorData = err.response.data.errors;
      // map over errors to generate jsx
      setErrors(
        <div className="alert alert-danger">
          <h4>Oops...</h4>
          <ul className="my-0">
            {errorData.map((err) => (
              <li key={err.message}>{err.message}</li>
            ))}
          </ul>
        </div>
      );
    }
  }

  return { doRequest, errors };
}
