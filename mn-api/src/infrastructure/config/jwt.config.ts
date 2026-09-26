
export const accessTokenConfig = {
    secret: process.env.ACCESS_TOKEN_SECRET || 'access-token-secret',
    expiresIn: '30d', 
  };
  
  export const refreshTokenConfig = {
    secret: process.env.REFRESH_TOKEN_SECRET || 'refresh-token-secret',
    expiresIn: '60d', 
  };
  