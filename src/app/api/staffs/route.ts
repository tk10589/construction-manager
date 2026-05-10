import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const staff = await prisma.staff.findMany({
    orderBy: {
      id: "asc",
    },
  });

  return NextResponse.json(staff);
}

export async function POST(request: Request) {
  const body = await request.json();

  const staff = await prisma.staff.create({
    data: {
      name: body.name,
    },
  });

  return NextResponse.json(staff);
}