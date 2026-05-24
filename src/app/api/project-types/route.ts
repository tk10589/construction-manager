import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const types = await prisma.projectType.findMany({
    orderBy: { id: "asc" },
  });

  return NextResponse.json(types);
}

export async function POST(request: Request) {
  const body = await request.json();

  const type = await prisma.projectType.create({
    data: {
      code: body.code,
      name: body.name,
    },
  });

  return NextResponse.json(type);
}