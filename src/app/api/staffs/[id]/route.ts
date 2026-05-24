import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  // ① 担当者取得
  const staff = await prisma.staff.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!staff) {
    return NextResponse.json(
      { error: "担当者が見つかりません" },
      { status: 404 }
    );
  }

  // ② 案件で使用中か確認
  const usedProject = await prisma.project.findFirst({
    where: {
      manager: staff.name,
    },
  });

  // ③ 使用中なら削除不可
  if (usedProject) {
    return NextResponse.json(
      {
        error:
          "この担当者は案件で使用中のため削除できません",
      },
      { status: 400 }
    );
  }

  // ④ 削除
  await prisma.staff.delete({
    where: {
      id: Number(id),
    },
  });

  return NextResponse.json({
    success: true,
  });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await request.json();

  const oldStaff = await prisma.staff.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!oldStaff) {
    return NextResponse.json(
      { error: "担当者が見つかりません" },
      { status: 404 }
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const staff = await tx.staff.update({
      where: {
        id: Number(id),
      },
      data: {
        name: body.name,
      },
    });

    await tx.project.updateMany({
      where: {
        manager: oldStaff.name,
      },
      data: {
        manager: body.name,
      },
    });

    return staff;
  });

  return NextResponse.json(result);
}