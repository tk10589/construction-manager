import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();

  if (!session?.user?.companyId) {
    return NextResponse.json(
      { error: "ログインが必要です" },
      { status: 401 }
    );
  }

  const clients = await prisma.client.findMany({
    where: {
      companyId: session.user.companyId,
    },
    orderBy: {
      name: "asc",
    },
  });

  return NextResponse.json(clients);
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.companyId) {
    return NextResponse.json(
      { error: "ログインが必要です" },
      { status: 401 }
    );
  }

  const body = await request.json();

  if (!body.name) {
    return NextResponse.json(
      { error: "発注者名を入力してください" },
      { status: 400 }
    );
  }

  const client = await prisma.client.create({
    data: {
      name: body.name,
      companyId: session.user.companyId,
    },
  });

  return NextResponse.json(client, { status: 201 });
}