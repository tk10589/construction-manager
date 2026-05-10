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