import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  await prisma.project.delete({
    where: {
      id: Number(id),
    },
  });

  return NextResponse.json({ message: "削除しました" });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const body = await request.json();

 const exists = await prisma.project.findFirst({
  where: {
    code: body.code,
    NOT: {
      id: Number(id),
    },
  },
});

if (exists) {
  return NextResponse.json(
    { error: "この案件番号は既に登録されています" },
    { status: 400 }
  );
}

const project = await prisma.project.update({
  where: {
    id: Number(id),
  },
  data: {
    code: body.code,
    type: body.type,
    name: body.name,
    client: body.client,
    manager: body.manager,
    amount: Number(body.amount),
    budget: body.budget ?? null,
    status: body.status,
    orderDate: body.orderDate ? new Date(body.orderDate) : null,
    startDate: body.startDate ? new Date(body.startDate) : null,
    endDate: body.endDate ? new Date(body.endDate) : null,
  },
});

  return NextResponse.json(project);
}