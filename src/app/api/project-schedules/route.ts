import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request
) {
  try {
    const { searchParams } = new URL(request.url);

    const projectId = Number(
      searchParams.get("projectId")
    );

    if (!projectId) {
      return NextResponse.json(
        {
          error: "projectId is required",
        },
        {
          status: 400,
        }
      );
    }

    const schedules =
      await prisma.projectSchedule.findMany({
        where: {
          projectId,
        },
        orderBy: {
          startDate: "asc",
        },
      });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "工程取得に失敗しました",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    const body = await request.json();

    const schedule =
      await prisma.projectSchedule.create({
        data: {
          projectId: body.projectId,

          startDate: new Date(
            body.startDate
          ),

          endDate: new Date(
            body.endDate
          ),

          title: body.title,

          memo: body.memo || "",
        },
      });

    return NextResponse.json(schedule);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "工程登録に失敗しました",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request: Request
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const id = Number(
      searchParams.get("id")
    );

    if (!id) {
      return NextResponse.json(
        {
          error: "id is required",
        },
        {
          status: 400,
        }
      );
    }

    await prisma.projectSchedule.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "工程削除に失敗しました",
      },
      {
        status: 500,
      }
    );
  }
}