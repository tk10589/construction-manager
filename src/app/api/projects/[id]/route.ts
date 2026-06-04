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
  const projectId = Number(id);

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      companyId: session.user.companyId,
    },
  });

  if (!project) {
    return NextResponse.json(
      { error: "案件が見つかりません" },
      { status: 404 }
    );
  }

  await prisma.project.delete({
    where: {
      id: projectId,
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
  const projectId = Number(id);
  const body = await request.json();

  const existingProject = await prisma.project.findFirst({
    where: {
      id: projectId,
      companyId: session.user.companyId,
    },
  });

  if (!existingProject) {
    return NextResponse.json(
      { error: "案件が見つかりません" },
      { status: 404 }
    );
  }

  const project = await prisma.project.update({
    where: {
      id: projectId,
    },
    data: {
      code: body.code,
      type: body.type,
      name: body.name,
      client: body.client,
      manager: body.manager,

      salesStaff: body.salesStaff || null,
      clientStaff: body.clientStaff || null,
      outsourceCompany: body.outsourceCompany || null,

      amount: Number(body.amount),

      additionalAmount:
        body.additionalAmount !== undefined
          ? Number(body.additionalAmount)
          : null,

      materialCost:
        body.materialCost !== undefined
          ? Number(body.materialCost)
          : null,

      laborCost:
        body.laborCost !== undefined
          ? Number(body.laborCost)
          : null,

      expenseCost:
        body.expenseCost !== undefined
          ? Number(body.expenseCost)
          : null,

      outsourceCost:
        body.outsourceCost !== undefined
          ? Number(body.outsourceCost)
          : null,

      budget: body.budget,
      status: body.status,
      note: body.note || null,

      orderDate: body.orderDate ? new Date(body.orderDate) : null,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
    },
  });

  return NextResponse.json(project);
}