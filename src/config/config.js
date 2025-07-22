const JWT_ACCESS_SECRET = {
  jwt: process.env.JWT_ACCESS_SECRET,
  jwtExp: "1d",
};

const JWT_REFRESH_SECRET = {
  jwt: process.env.JWT_REFRESH_SECRET,
  jwtExp: "7d",
};

export { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET };
