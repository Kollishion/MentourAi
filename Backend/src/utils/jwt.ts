import { Role } from "@prisma/client";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const accessSecretValue = process.env.JWT_ACCESS_SECRET;
const refreshSecretValue = process.env.JWT_REFRESH_SECRET;

if (!accessSecretValue || !refreshSecretValue) {
  throw new Error("JWT secrets are not configured.");
}

const accessSecret = new TextEncoder().encode(accessSecretValue);

const refreshSecret = new TextEncoder().encode(refreshSecretValue);

const accessExpiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN;
const refreshExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN;

if (!accessExpiresIn || !refreshExpiresIn) {
  throw new Error("JWT expiration settings are not configured.");
}

export interface JwtPayload extends JWTPayload{
  id: string;
  email: string;
  role: Role;
}

const signToken = async (
  payload: JwtPayload,
  secret: Uint8Array,
  expiresIn: string,
): Promise<string> => {
  return await new SignJWT(payload)
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
};

export const generateAccessToken = async (
  payload: JwtPayload,
): Promise<string> => {
  return signToken(
    payload,
    accessSecret,
    accessExpiresIn
  );
};

export const generateRefreshToken = async (
  payload: JwtPayload,
): Promise<string> => {
  return signToken(
    payload,
    refreshSecret,
    refreshExpiresIn
  );
};

export const verifyAccessToken = async (
  token: string,
): Promise<JwtPayload> => {
  const { payload } = await jwtVerify<JwtPayload>(token, accessSecret);

  return payload;
};

export const verifyRefreshToken = async (
  token: string,
): Promise<JwtPayload> => {
  const { payload } = await jwtVerify<JwtPayload>(token, refreshSecret);

  return payload;
};
