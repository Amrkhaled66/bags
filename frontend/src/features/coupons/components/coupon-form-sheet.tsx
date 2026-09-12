import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { ApiError } from "@/shared/api/client";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import { Switch } from "@/shared/components/ui/switch";
import {
  couponFormSchema,
  type CouponFormValues,
} from "../schemas/coupon.schema";
import type { Coupon, CouponMutationPayload } from "../types/coupon";

function formatDateInput(value: string | null | undefined) {
  if (!value) return "";
  return value.slice(0, 10);
}

function getDefaults(coupon?: Coupon | null): CouponFormValues {
  return {
    code: coupon?.code ?? "",
    percentage: coupon?.percentage ?? "",
    minimumOrder: coupon?.minimumOrder ?? "0.00",
    usageLimit: coupon?.usageLimit ? String(coupon.usageLimit) : "",
    expiresAt: formatDateInput(coupon?.expiresAt),
    isActive: coupon?.isActive ?? true,
  };
}

function dateInputToIso(value?: string) {
  if (!value) return null;
  return new Date(`${value}T23:59:59.999`).toISOString();
}

function normalizePayload(values: CouponFormValues): CouponMutationPayload {
  const usageLimit = values.usageLimit?.trim();
  return {
    code: values.code.trim().toUpperCase(),
    percentage: values.percentage.trim(),
    minimumOrder: values.minimumOrder.trim(),
    usageLimit: usageLimit ? Number(usageLimit) : null,
    expiresAt: dateInputToIso(values.expiresAt),
    isActive: values.isActive,
  };
}

function CouponFormSheetInner({
  open,
  coupon,
  onOpenChange,
  onSubmitCoupon,
}: {
  open: boolean;
  coupon?: Coupon | null;
  onOpenChange: (open: boolean) => void;
  onSubmitCoupon: (payload: CouponMutationPayload) => Promise<Coupon>;
}) {
  const [discardOpen, setDiscardOpen] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: getDefaults(coupon),
  });
  const isActive = useWatch({ control: form.control, name: "isActive" });
  const isDirty = form.formState.isDirty;

  function requestClose(nextOpen: boolean) {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }
    if (submitting) return;
    if (isDirty) {
      setDiscardOpen(true);
      return;
    }
    onOpenChange(false);
  }

  async function submit(values: CouponFormValues) {
    setSubmitting(true);
    setApiError(null);
    try {
      const saved = await onSubmitCoupon(normalizePayload(values));
      form.reset(getDefaults(saved));
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        form.setError("code", {
          type: "server",
          message: "This coupon code already exists.",
        });
      } else {
        setApiError(
          error instanceof Error ? error.message : "Coupon could not be saved.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={requestClose}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader className="border-b px-5 py-4">
            <SheetTitle>{coupon ? "Edit coupon" : "Create coupon"}</SheetTitle>
            <SheetDescription>
              Configure discount percentage, limits, and availability.
            </SheetDescription>
          </SheetHeader>
          <form
            className="flex flex-1 flex-col"
            onSubmit={form.handleSubmit((values) => void submit(values))}
          >
            <div className="flex-1 space-y-5 px-5 py-5">
              {apiError && (
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertTitle>Could not save coupon</AlertTitle>
                  <AlertDescription>{apiError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="coupon-code">Code</Label>
                <Input
                  id="coupon-code"
                  className="uppercase"
                  disabled={submitting}
                  aria-invalid={!!form.formState.errors.code}
                  {...form.register("code")}
                />
                {form.formState.errors.code && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.code.message}
                  </p>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="coupon-percentage">Percentage</Label>
                  <Input
                    id="coupon-percentage"
                    inputMode="decimal"
                    disabled={submitting}
                    aria-invalid={!!form.formState.errors.percentage}
                    {...form.register("percentage")}
                  />
                  {form.formState.errors.percentage && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.percentage.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coupon-minimum-order">Minimum order</Label>
                  <Input
                    id="coupon-minimum-order"
                    inputMode="decimal"
                    disabled={submitting}
                    aria-invalid={!!form.formState.errors.minimumOrder}
                    {...form.register("minimumOrder")}
                  />
                  {form.formState.errors.minimumOrder && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.minimumOrder.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="coupon-usage-limit">Usage limit</Label>
                  <Input
                    id="coupon-usage-limit"
                    inputMode="numeric"
                    placeholder="Unlimited"
                    disabled={submitting}
                    aria-invalid={!!form.formState.errors.usageLimit}
                    {...form.register("usageLimit")}
                  />
                  {form.formState.errors.usageLimit && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.usageLimit.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coupon-expires-at">Expires at</Label>
                  <Input
                    id="coupon-expires-at"
                    type="date"
                    disabled={submitting}
                    aria-invalid={!!form.formState.errors.expiresAt}
                    {...form.register("expiresAt")}
                  />
                  {form.formState.errors.expiresAt && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.expiresAt.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-md border p-4">
                <div className="space-y-1">
                  <Label htmlFor="coupon-active">Active</Label>
                  <p className="text-sm text-muted-foreground">
                    Active coupons can be applied during checkout.
                  </p>
                </div>
                <Switch
                  id="coupon-active"
                  checked={isActive}
                  disabled={submitting}
                  onCheckedChange={(checked) =>
                    form.setValue("isActive", checked, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                />
              </div>
            </div>
            <SheetFooter className="border-t px-5 py-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => requestClose(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <LoaderCircle className="animate-spin" />}
                {coupon ? "Save changes" : "Create coupon"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              The current coupon form has unsaved changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDiscardOpen(false);
                onOpenChange(false);
              }}
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function CouponFormSheet(props: {
  open: boolean;
  coupon?: Coupon | null;
  onOpenChange: (open: boolean) => void;
  onSubmitCoupon: (payload: CouponMutationPayload) => Promise<Coupon>;
}) {
  const key = props.open ? props.coupon?.id ?? "create" : "closed";
  return <CouponFormSheetInner key={key} {...props} />;
}
