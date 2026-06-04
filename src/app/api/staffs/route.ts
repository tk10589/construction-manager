import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();

  if (!session?.user?.companyId) {
    return NextResponse.json(
      { error: "ログインが必要です" },
      { status: 401 }
    );
  }

  const staffs = await prisma.staff.findMany({
    where: {
      companyId: session.user.companyId,
    },
    orderBy: {
      name: "asc",
    },
  });

  return NextResponse.json(staffs);
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

  if (!body.name) {
    return NextResponse.json(
      { error: "担当者名を入力してください" },
      { status: 400 }
    );
  }

  const staff = await prisma.staff.create({
    data: {
      name: body.name,
      companyId: session.user.companyId,
    },
  });

  return NextResponse.json(staff, { status: 201 });
}