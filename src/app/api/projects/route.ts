import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { discoverValidationDepths } from "next/dist/server/app-render/instant-validation/instant-validation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("q") || "";

  const projects = await prisma.project.findMany({
    where: {
      code: {
        contains: keyword,
      },
    },
    orderBy: {
      code: "asc",
    },
  });

  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  const body = await request.json();

  // ① 必須チェック
  if (!body.code) {
    return NextResponse.json(
      { error: "案件番号を入力してください" },
      { status: 400 }
    );
  }

  if (!body.type) {
    return NextResponse.json(
      { error: "種別を選択してください" },
      { status: 400 }
    );
  }

  // ② 案件番号の形式チェック
  if (!/^[A-Za-z0-9-]+$/.test(body.code)) {
    return NextResponse.json(
      { error: "案件番号は半角英数字とハイフンのみ使用できます" },
      { status: 400 }
    );
  }

  // ③ 重複チェック
  const exists = await prisma.project.findUnique({
    where: {
      code: body.code,
    },
  });

  if (exists) {
    return NextResponse.json(
      { error: "この案件番号は既に登録されています" },
      { status: 400 }
    );
  }

  // ④ 登録
  const project = await prisma.project.create({
    data: {
      code: body.code,
      type: body.type,

      name: body.name,
      client: body.client,
      manager: body.manager,

      amount: body.amount,
      budget: body.budget,

      status: body.status,

      orderDate: body.orderDate
      ? new Date(body.orderDate)
      : null,

      startDate: body.startDate
        ? new Date(body.startDate)
        : null,

      endDate: body.endDate
        ? new Date(body.endDate)
        : null,
    },
  });

  return NextResponse.json(project);
}