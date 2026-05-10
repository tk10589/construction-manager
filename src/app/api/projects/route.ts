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

  const project = await prisma.$transaction(async (tx) => {
    const type = body.type; // "F", "FE", "E", "MM"
    const year = new Date().getFullYear();

    const counterKey = `${type}-${year}`;

    // ① カウンタ取得
    let counter = await tx.counter.findUnique({
      where: { name: counterKey },
    });

    // ② 無ければ作成（年が変わった時）
    if (!counter) {
      counter = await tx.counter.create({
        data: {
          name: counterKey,
          value: 0,
        },
      });
    }

    if (!body.type) {
      return NextResponse.json(
        { error: "type is required" },
        { status: 400 }
      );
    }

    // ③ +1
    const updated = await tx.counter.update({
      where: { name: counterKey },
      data: {
        value: { increment: 1 },
      },
    });

    // ④ code生成
    const code =
      `${type}-${year}-` +
      String(updated.value).padStart(3, "0");

    // ⑤ 登録
    return await tx.project.create({
      data: {
        code,
        type, // ←追加
        name: body.name,
        client: body.client,
        manager: body.manager,
        amount: body.amount,
        status: body.status,

        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
      },
    });
  });

  return NextResponse.json(project);
}