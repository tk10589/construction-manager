import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();

  const { token, password } = body;

  if (!token || !password) {
    return NextResponse.json(
      { error: "必要な情報が不足しています" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "パスワードは8文字以上で入力してください" },
      { status: 400 }
    );
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: {
      token,
    },
  });

  if (!resetToken || resetToken.used) {
    return NextResponse.json(
      { error: "再設定URLが無効です" },
      { status: 400 }
    );
  }

  if (resetToken.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "再設定URLの有効期限が切れています" },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: {
      email: resetToken.email,
    },
    data: {
      passwordHash,
    },
  });

  await prisma.passwordResetToken.update({
    where: {
      token,
    },
    data: {
      used: true,
    },
  });

  return NextResponse.json({
    message: "パスワードを再設定しました",
  });
}