import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const COOKIE_NAME = "revabox_session";

function getSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET must be set and contain at least 32 characters."
    );
  }

  return new TextEncoder().encode(secret);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({
    userId,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());

  const cookieStore = await cookies();

  cookieStore.set({
    name: COOKIE_NAME,
    value: token,

    httpOnly: true,

    secure:
      process.env.NODE_ENV === "production",

    sameSite: "lax",

    path: "/",

    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();

  cookieStore.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure:
      process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();

    const token =
      cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const { payload } =
      await jwtVerify(
        token,
        getSecret()
      );

    const userId =
      typeof payload.userId === "string"
        ? payload.userId
        : null;

    if (!userId) {
      return null;
    }

    const user =
      await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

    return user;
  } catch (error) {
    console.error(
      "GET_CURRENT_USER_ERROR:",
      error
    );

    return null;
  }
}