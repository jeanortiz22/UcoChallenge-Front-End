let auth0Client = null;

export const setAuth0Client = (client) => {
  auth0Client = client;
};

export const getAuth0Client = () => auth0Client;
