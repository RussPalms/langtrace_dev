import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/prisma";
import { TraceService } from "@/lib/services/trace_service";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const apiKey = req.headers.get("x-api-key");

    if (!apiKey) {
      if (!session || !session.user) {
        redirect("/login");
      }
    }

    const { page, pageSize, projectId, filters } = await req.json();

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      return Response.json({ error: "No projects found" }, { status: 404 });
    }

    if (apiKey && project.apiKeyHash !== hashApiKey(apiKey)) {
      return Response.json(
        { error: "Unauthorized. Invalid API key" },
        { status: 401 }
      );
    }

    const traceService = new TraceService();
    const traces = await traceService.GetTracesInProjectPaginated(
      projectId,
      page,
      pageSize,
      filters
    );

    return NextResponse.json(
      {
        traces,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "Something went wrong while fetching traces",
      },
      { status: 400 }
    );
  }
}
