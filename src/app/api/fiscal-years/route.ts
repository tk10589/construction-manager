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

export async function GET() {
  const session = await auth();

  if (!session?.user?.companyId) {
    return NextResponse.json(
      { error: "ログインが必要です" },
      { status: 401 }
    );
  }

  const fiscalYears = await prisma.fiscalYear.findMany({
    where: {
      companyId: session.user.companyId,
    },
    orderBy: {
      year: "desc",
    },
  });

  return NextResponse.json(fiscalYears);
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
    const fiscalYear = await prisma.fiscalYear.create({
      data: {
        year,
        endMonth,
        startDate,
        endDate,
        companyId: session.user.companyId,
      },
    });

    return NextResponse.json(fiscalYear, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "同じ年度がすでに登録されています" },
      { status: 400 }
    );
  }
}