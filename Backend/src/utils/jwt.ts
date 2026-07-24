import { SignJWT, jwtVerify } from "jose";

const ACCESS_SECRET = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET!
);

const REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET!
);

const ACCESS_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN!;
const REFRESH_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN!;

type TokenPayload = {
  id: string;
  email: string;
  role: string;
};

export async function generateAccessToken(payload: TokenPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_EXPIRES_IN)
    .sign(ACCESS_SECRET);
}

export async function generateRefreshToken(payload: TokenPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_EXPIRES_IN)
    .sign(REFRESH_SECRET);
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, ACCESS_SECRET);

  return {
    id: payload.id as string,
    email: payload.email as string,
    role: payload.role as string,
  };
}

export async function verifyRefreshToken(token: string) {
  const { payload } = await jwtVerify(token, REFRESH_SECRET);

  return {
    id: payload.id as string,
    email: payload.email as string,
    role: payload.role as string,
  };
}
