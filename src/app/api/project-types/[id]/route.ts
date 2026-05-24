import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await request.json();

  const oldType = await prisma.projectType.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!oldType) {
    return NextResponse.json(
      { error: "種別が見つかりません" },
      { status: 404 }
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const type = await tx.projectType.update({
      where: {
        id: Number(id),
      },
      data: {
        code: body.code,
        name: body.name,
      },
    });

    // codeが変わった場合のみ案件側も更新
    if (oldType.code !== body.code) {
      await tx.project.updateMany({
        where: {
          type: oldType.code,
        },
        data: {
          type: body.code,
        },
      });
    }

    return type;
  });

  return NextResponse.json(result);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  // ① 種別取得
  const type = await prisma.projectType.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!type) {
    return NextResponse.json(
      { error: "種別が見つかりません" },
      { status: 404 }
    );
  }

  // ② 使用中案件確認
  const usedProject = await prisma.project.findFirst({
    where: {
      type: type.code,
    },
  });

  // ③ 使用中なら削除拒否
  if (usedProject) {
    return NextResponse.json(
      {
        error:
          "この種別は案件で使用中のため削除できません",
      },
      { status: 400 }
    );
  }

  // ④ 削除
  await prisma.projectType.delete({
    where: {
      id: Number(id),
    },
  });

  return NextResponse.json({
    success: true,
  });
}