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

  const existingStaff = await prisma.staff.findFirst({
    where: {
      id: Number(id),
      companyId: session.user.companyId,
    },
  });

  if (!existingStaff) {
    return NextResponse.json(
      { error: "担当者が見つかりません" },
      { status: 404 }
    );
  }

  await prisma.staff.delete({
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

  const existingStaff = await prisma.staff.findFirst({
    where: {
      id: Number(id),
      companyId: session.user.companyId,
    },
  });

  if (!existingStaff) {
    return NextResponse.json(
      { error: "担当者が見つかりません" },
      { status: 404 }
    );
  }

  const staff = await prisma.staff.update({
    where: {
      id: Number(id),
    },
    data: {
      name: body.name,
    },
  });

  return NextResponse.json(staff);
}