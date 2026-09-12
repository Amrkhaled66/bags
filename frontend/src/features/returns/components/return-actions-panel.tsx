import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { ActionErrorAlert } from "@/shared/components/action-error-alert";
import { ConfirmActionDialog } from "@/shared/components/confirm-action-dialog";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Separator } from "@/shared/components/ui/separator";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  refundFormSchema,
  type RefundFormValues,
} from "../schemas/return.schema";
import type {
  CompleteRefundPayload,
  ReturnDetail,
  UpdateReturnStatusPayload,
} from "../types/return";

const allowedTransitions = {
  requested: ["approved", "rejected"],
  approved: ["received"],
  rejected: [],
  received: [],
  completed: [],
} as const;

const actionLabels: Record<UpdateReturnStatusPayload["status"], string> = {
  approved: "Approve",
  rejected: "Reject",
  received: "Mark received",
};

export function ReturnActionsPanel({
  returnRequest,
  pending,
  error,
  onUpdateStatus,
  onCompleteRefund,
}: {
  returnRequest: ReturnDetail;
  pending?: boolean;
  error?: unknown;
  onUpdateStatus: (payload: UpdateReturnStatusPayload) => Promise<void>;
  onCompleteRefund: (payload: CompleteRefundPayload) => Promise<void>;
}) {
  const [nextStatus, setNextStatus] =
    useState<UpdateReturnStatusPayload["status"] | null>(null);
  const refundForm = useForm<RefundFormValues>({
    resolver: zodResolver(refundFormSchema),
    defaultValues: { notes: "" },
  });
  const transitions = allowedTransitions[returnRequest.status];
  const canRefund =
    returnRequest.status === "received" && returnRequest.refunds.length === 0;

  async function submitRefund(values: RefundFormValues) {
    const notes = values.notes?.trim();
    await onCompleteRefund({ notes: notes || null });
    refundForm.reset({ notes: "" });
  }

  return (
    <section className="rounded-md border bg-background p-5">
      <h2 className="text-base font-semibold">Actions</h2>
      <Separator className="my-4" />
      <ActionErrorAlert error={error} />
      <div className="space-y-5">
        <div className="space-y-3">
          <div>
            <Label>Review status</Label>
            <p className="mt-1 text-sm text-muted-foreground">
              Move this return through the backend-supported return flow.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {transitions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No status changes are available.
              </p>
            ) : (
              transitions.map((status) => (
                <Button
                  key={status}
                  type="button"
                  variant={status === "rejected" ? "destructive" : "outline"}
                  disabled={pending}
                  onClick={() => setNextStatus(status)}
                >
                  {actionLabels[status]}
                </Button>
              ))
            )}
          </div>
        </div>
        <Separator />
        <form
          className="space-y-3"
          onSubmit={refundForm.handleSubmit((values) =>
            void submitRefund(values),
          )}
        >
          <div>
            <Label htmlFor="refund-notes">Complete refund</Label>
            <p className="mt-1 text-sm text-muted-foreground">
              Refund completion records a refund and updates payment status. It
              does not transfer money through a gateway.
            </p>
          </div>
          <Textarea
            id="refund-notes"
            placeholder="Optional internal notes"
            disabled={pending || !canRefund}
            aria-invalid={!!refundForm.formState.errors.notes}
            {...refundForm.register("notes")}
          />
          {refundForm.formState.errors.notes && (
            <p className="text-sm text-destructive">
              {refundForm.formState.errors.notes.message}
            </p>
          )}
          <Button type="submit" disabled={pending || !canRefund}>
            {pending && <LoaderCircle className="animate-spin" />}
            Record refund
          </Button>
        </form>
      </div>

      <ConfirmActionDialog
        open={!!nextStatus}
        onOpenChange={(open) => !open && setNextStatus(null)}
        title="Update return status?"
        description={`This will move the return for ${returnRequest.orderNumber ?? returnRequest.orderId} to ${nextStatus ?? "the selected status"}.`}
        actionLabel="Update status"
        actionVariant={nextStatus === "rejected" ? "destructive" : "default"}
        onConfirm={() => {
          if (!nextStatus) return;
          void onUpdateStatus({ status: nextStatus }).then(() =>
            setNextStatus(null),
          );
        }}
      />
    </section>
  );
}
