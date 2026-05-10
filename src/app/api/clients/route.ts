import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const clients = await prisma.client.findMany({
    orderBy: {
      id: "asc",
    },
  });

  return NextResponse.json(clients);
}

export async function POST(request: Request) {
  const body = await request.json();

  const client = await prisma.client.create({
    data: {
      name: body.name,
    },
  });

  return NextResponse.json(client);
}