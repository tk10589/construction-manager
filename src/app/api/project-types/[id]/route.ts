import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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

  const existingProjectType = await prisma.projectType.findFirst({
    where: {
      id: Number(id),
      companyId: session.user.companyId,
    },
  });

  if (!existingProjectType) {
    return NextResponse.json(
      { error: "種別が見つかりません" },
      { status: 404 }
    );
  }

  const duplicate = await prisma.projectType.findFirst({
    where: {
      companyId: session.user.companyId,
      code: body.code,
      NOT: {
        id: Number(id),
      },
    },
  });

  if (duplicate) {
    return NextResponse.json(
      { error: "この種別コードは既に登録されています" },
      { status: 400 }
    );
  }

  const projectType = await prisma.projectType.update({
    where: {
      id: Number(id),
    },
    data: {
      code: body.code,
      name: body.name,
    },
  });

  return NextResponse.json(projectType);
}

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

  const existingProjectType = await prisma.projectType.findFirst({
    where: {
      id: Number(id),
      companyId: session.user.companyId,
    },
  });

  if (!existingProjectType) {
    return NextResponse.json(
      { error: "種別が見つかりません" },
      { status: 404 }
    );
  }

  await prisma.projectType.delete({
    where: {
      id: Number(id),
    },
  });

  return NextResponse.json({ ok: true });
}