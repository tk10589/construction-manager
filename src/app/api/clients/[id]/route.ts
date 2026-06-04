import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.companyId) {
    return NextResponse.json(
      { error: "ログインが必要です" },
      { status: 401 }
    );
  }

  const { id } = await params;

  const existingClient = await prisma.client.findFirst({
    where: {
      id: Number(id),
      companyId: session.user.companyId,
    },
  });

  if (!existingClient) {
    return NextResponse.json(
      { error: "発注者が見つかりません" },
      { status: 404 }
    );
  }

  await prisma.client.delete({
    where: {
      id: Number(id),
    },
  });

  return NextResponse.json({ ok: true });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.companyId) {
    return NextResponse.json(
      { error: "ログインが必要です" },
      { status: 401 }
    );
  }

  const { id } = await params;
  const body = await request.json();

  const existingClient = await prisma.client.findFirst({
    where: {
      id: Number(id),
      companyId: session.user.companyId,
    },
  });

  if (!existingClient) {
    return NextResponse.json(
      { error: "発注者が見つかりません" },
      { status: 404 }
    );
  }

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