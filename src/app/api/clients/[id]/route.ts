import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  // ① 発注者取得
  const client = await prisma.client.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!client) {
    return NextResponse.json(
      { error: "発注者が見つかりません" },
      { status: 404 }
    );
  }

  // ② 案件で使用中か確認
  const usedProject = await prisma.project.findFirst({
    where: {
      client: client.name,
    },
  });

  // ③ 使用中なら削除不可
  if (usedProject) {
    return NextResponse.json(
      {
        error:
          "この発注者は案件で使用中のため削除できません",
      },
      { status: 400 }
    );
  }

  // ④ 削除
  await prisma.client.delete({
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

  const oldClient = await prisma.client.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!oldClient) {
    return NextResponse.json(
      { error: "発注者が見つかりません" },
      { status: 404 }
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const client = await tx.client.update({
      where: {
        id: Number(id),
      },
      data: {
        name: body.name,
      },
    });

    await tx.project.updateMany({
      where: {
        client: oldClient.name,
      },
      data: {
        client: body.name,
      },
    });

    return client;
  });

  return NextResponse.json(result);
}