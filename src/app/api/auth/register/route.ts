import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();

  const {
    loginId,
    password,
    companyName,
    userName,
    address,
    email,
  } = body;

  if (
    !loginId ||
    !password ||
    !companyName ||
    !userName ||
    !email
  ) {
    return NextResponse.json(
      { error: "必須項目を入力してください" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "パスワードは8文字以上で入力してください" },
      { status: 400 }
    );
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { loginId },
        { email },
      ],
    },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "ログインIDまたはメールアドレスはすでに使用されています" },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const company = await prisma.company.create({
    data: {
      name: companyName,
      address: address || null,
      users: {
        create: {
          loginId,
          email,
          passwordHash,
          name: userName,
        },
      },
    },
    include: {
      users: true,
    },
  });

  return NextResponse.json(
    {
      id: company.users[0].id,
      loginId: company.users[0].loginId,
      companyName: company.name,
      userName: company.users[0].name,
    },
    { status: 201 }
  );
}