import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

const fields = ["name","frontImage","backImage","leftImage","rightImage","topImage","bottomImage","background","scale"] as const;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const projects = await prisma.project.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ projects });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const project = await prisma.project.create({
    data: {
      userId: user.id,
      name: String(body.name || "Untitled box"),
      frontImage: body.frontImage || null,
      backImage: body.backImage || null,
      leftImage: body.leftImage || null,
      rightImage: body.rightImage || null,
      topImage: body.topImage || null,
      bottomImage: body.bottomImage || null,
      background: body.background || "#111827",
      scale: Number(body.scale || 1),
    },
  });
  return NextResponse.json({ project });
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "Project id required." }, { status: 400 });

  const existing = await prisma.project.findFirst({ where: { id: body.id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Project not found." }, { status: 404 });

  const project = await prisma.project.update({
    where: { id: body.id },
    data: {
      name: String(body.name || existing.name),
      frontImage: body.frontImage ?? null,
      backImage: body.backImage ?? null,
      leftImage: body.leftImage ?? null,
      rightImage: body.rightImage ?? null,
      topImage: body.topImage ?? null,
      bottomImage: body.bottomImage ?? null,
      background: body.background || existing.background,
      scale: Number(body.scale || existing.scale),
    },
  });
  return NextResponse.json({ project });
}
