import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../lib/prisma";
import { createSession } from "../../../../lib/auth";

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const email =
      typeof body.email === "string"
        ? body.email
            .trim()
            .toLowerCase()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (!email) {
      return NextResponse.json(
        {
          error:
            "Email is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!password) {
      return NextResponse.json(
        {
          error:
            "Password is required.",
        },
        {
          status: 400,
        }
      );
    }

    const user =
      await prisma.user.findUnique({
        where: {
          email,
        },
      });

    /*
     * Do not reveal whether the
     * email exists.
     */
    if (!user) {
      return NextResponse.json(
        {
          error:
            "Invalid email or password.",
        },
        {
          status: 401,
        }
      );
    }

    const passwordMatches =
      await bcrypt.compare(
        password,
        user.passwordHash
      );

    if (!passwordMatches) {
      return NextResponse.json(
        {
          error:
            "Invalid email or password.",
        },
        {
          status: 401,
        }
      );
    }

    await createSession(
      user.id
    );

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        planKey: user.planKey,
        status:
          user.subscriptionStatus,
      },
    });
  } catch (error) {
    console.error(
      "SIGNIN_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to sign in. Please try again.",
      },
      {
        status: 500,
      }
    );
  }
}