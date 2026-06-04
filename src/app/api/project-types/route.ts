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

  const projectTypes = await prisma.projectType.findMany({
    where: {
      companyId: session.user.companyId,
    },
    orderBy: {
      code: "asc",
    },
  });

  return NextResponse.json(projectTypes);
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

  if (!body.code || !body.name) {
    return NextResponse.json(
      { error: "種別コードと種別名を入力してください" },
      { status: 400 }
    );
  }

  const exists = await prisma.projectType.findFirst({
    where: {
      companyId: session.user.companyId,
      code: body.code,
    },
  });

  if (exists) {
    return NextResponse.json(
      { error: "この種別コードは既に登録されています" },
      { status: 400 }
    );
  }

  const projectType = await prisma.projectType.create({
    data: {
      code: body.code,
      name: body.name,
      companyId: session.user.companyId,
    },
  });

  return NextResponse.json(projectType, { status: 201 });
}