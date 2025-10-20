import { TokenData } from 'src/auth/interface/auth.interface';

// export const createCookie = (tokenData: TokenData): string => {
//   return `Authorization=${tokenData.token}; HttpOnly; Max-Age=${tokenData.expiresIn};SameSite=Lax`;
// };

export const createCookie = (refreshTokenData: TokenData): string => {
  let cookieString = `refreshToken=${refreshTokenData.token}; HttpOnly; Max-Age=${refreshTokenData.expiresIn}; Path=/`;

  // Gardez 'SameSite=Lax' ou ne mettez rien en dev HTTP
  cookieString += '; SameSite=none; secure=false';

  return cookieString;
};
