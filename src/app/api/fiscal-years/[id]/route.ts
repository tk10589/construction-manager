import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const createFiscalDates = (year: number, endMonth: number) => {
  const startMonth = endMonth === 12 ? 1 : endMonth + 1;
  const startYear = endMonth === 12 ? year : year;
  const endYear = endMonth === 12 ? year : year + 1;

  const startDate = new Date(startYear, startMonth - 1, 1);
  const endDate = new Date(endYear, endMonth, 0);

  return {
    startDate,
    endDate,
  };
};

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

  const existingFiscalYear = await prisma.fiscalYear.findFirst({
    where: {
      id: Number(id),
      companyId: session.user.companyId,
    },
  });

  if (!existingFiscalYear) {
    return NextResponse.json(
      { error: "年度が見つかりません" },
      { status: 404 }
    );
  }

  await prisma.fiscalYear.delete({
    where: {
      id: Number(id),
    },
  });

  return NextResponse.json({ ok: true });
}

type Params = {
  params: Promise<{
    id: string;
  }>;
};

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

  const existingFiscalYear = await prisma.fiscalYear.findFirst({
    where: {
      id: Number(id),
      companyId: session.user.companyId,
    },
  });

  if (!existingFiscalYear) {
    return NextResponse.json(
      { error: "年度が見つかりません" },
      { status: 404 }
    );
  }

  const year = Number(body.year);
  const endMonth = Number(body.endMonth);

  const { startDate, endDate } = createFiscalDates(year, endMonth);

  const fiscalYear = await prisma.fiscalYear.update({
    where: {
      id: Number(id),
    },
    data: {
      year,
      endMonth,
      startDate,
      endDate,
    },
  });

  return NextResponse.json(fiscalYear);
}