import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();

  const year = Number(body.year);
  const endMonth = Number(body.endMonth);

  if (!year || year < 2000) {
    return NextResponse.json(
      { error: "年度を正しく入力してください" },
      { status: 400 }
    );
  }

  if (!endMonth || endMonth < 1 || endMonth > 12) {
    return NextResponse.json(
      { error: "年度末月を1〜12で入力してください" },
      { status: 400 }
    );
  }

  const { startDate, endDate } = createFiscalDates(year, endMonth);

  try {
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
  } catch {
    return NextResponse.json(
      { error: "年度の更新に失敗しました" },
      { status: 400 }
    );
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params;

  try {
    await prisma.fiscalYear.delete({
      where: {
        id: Number(id),
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "年度の削除に失敗しました" },
      { status: 400 }
    );
  }
}