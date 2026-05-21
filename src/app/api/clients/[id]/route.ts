import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  await prisma.client.delete({
    where: {
      id: Number(id),
    },
  });

  return NextResponse.json({ success: true });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await request.json();

  const client = await prisma.client.update({
    where: {
      id: Number(id),
    },
    data: {
      name: body.name,
    },
  });

  return NextResponse.json(client);
}