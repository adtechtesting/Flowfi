import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/db";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status !== "PENDING" && invoice.status !== "FAILED") {
      return NextResponse.json(
        { error: "Can only delete pending or failed jobs." },
        { status: 400 }
      );
    }

    await prisma.invoice.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete Invoice Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { jobTitle, amount, freelancerWallet } = await req.json();

    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status !== "PENDING" && invoice.status !== "FAILED") {
      return NextResponse.json(
        { error: "Can only edit pending or failed jobs." },
        { status: 400 }
      );
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        jobTitle,
        amount: Math.round(parseFloat(amount) * 100),
        freelancerWallet,
      },
    });

    return NextResponse.json({ success: true, job: updated });
  } catch (error: any) {
    console.error("Edit Invoice Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
