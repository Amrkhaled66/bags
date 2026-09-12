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
  shippingRateFormSchema,
  type ShippingRateFormValues,
} from "../schemas/shipping-rate.schema";
import type {
  ShippingRate,
  ShippingRateMutationPayload,
} from "../types/shipping-rate";

function getDefaults(shippingRate?: ShippingRate | null): ShippingRateFormValues {
  return {
    governorate: shippingRate?.governorate ?? "",
    shippingPrice: shippingRate?.shippingPrice ?? "",
    freeShippingThreshold: shippingRate?.freeShippingThreshold ?? "",
    isActive: shippingRate?.isActive ?? true,
  };
}

function normalizePayload(
  values: ShippingRateFormValues,
): ShippingRateMutationPayload {
  const freeShippingThreshold = values.freeShippingThreshold?.trim();
  return {
    governorate: values.governorate.trim(),
    shippingPrice: values.shippingPrice.trim(),
    freeShippingThreshold: freeShippingThreshold
      ? freeShippingThreshold
      : null,
    isActive: values.isActive,
  };
}

function ShippingRateFormSheetInner({
  open,
  shippingRate,
  onOpenChange,
  onSubmitShippingRate,
}: {
  open: boolean;
  shippingRate?: ShippingRate | null;
  onOpenChange: (open: boolean) => void;
  onSubmitShippingRate: (
    payload: ShippingRateMutationPayload,
  ) => Promise<ShippingRate>;
}) {
  const [discardOpen, setDiscardOpen] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<ShippingRateFormValues>({
    resolver: zodResolver(shippingRateFormSchema),
    defaultValues: getDefaults(shippingRate),
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

  async function submit(values: ShippingRateFormValues) {
    setSubmitting(true);
    setApiError(null);
    try {
      const saved = await onSubmitShippingRate(normalizePayload(values));
      form.reset(getDefaults(saved));
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        form.setError("governorate", {
          type: "server",
          message: "This governorate already has a shipping rate.",
        });
      } else {
        setApiError(
          error instanceof Error
            ? error.message
            : "Shipping rate could not be saved.",
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
            <SheetTitle>
              {shippingRate ? "Edit shipping rate" : "Create shipping rate"}
            </SheetTitle>
            <SheetDescription>
              Configure delivery pricing by governorate.
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
                  <AlertTitle>Could not save shipping rate</AlertTitle>
                  <AlertDescription>{apiError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="shipping-governorate">Governorate</Label>
                <Input
                  id="shipping-governorate"
                  disabled={submitting}
                  aria-invalid={!!form.formState.errors.governorate}
                  {...form.register("governorate")}
                />
                {form.formState.errors.governorate && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.governorate.message}
                  </p>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="shipping-price">Shipping price</Label>
                  <Input
                    id="shipping-price"
                    inputMode="decimal"
                    disabled={submitting}
                    aria-invalid={!!form.formState.errors.shippingPrice}
                    {...form.register("shippingPrice")}
                  />
                  {form.formState.errors.shippingPrice && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.shippingPrice.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shipping-free-threshold">
                    Free shipping from
                  </Label>
                  <Input
                    id="shipping-free-threshold"
                    inputMode="decimal"
                    placeholder="Optional"
                    disabled={submitting}
                    aria-invalid={!!form.formState.errors.freeShippingThreshold}
                    {...form.register("freeShippingThreshold")}
                  />
                  {form.formState.errors.freeShippingThreshold && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.freeShippingThreshold.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-md border p-4">
                <div className="space-y-1">
                  <Label htmlFor="shipping-active">Active</Label>
                  <p className="text-sm text-muted-foreground">
                    Active rates can be used during checkout.
                  </p>
                </div>
                <Switch
                  id="shipping-active"
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
                {shippingRate ? "Save changes" : "Create shipping rate"}
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
              The current shipping rate form has unsaved changes.
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

export function ShippingRateFormSheet(props: {
  open: boolean;
  shippingRate?: ShippingRate | null;
  onOpenChange: (open: boolean) => void;
  onSubmitShippingRate: (
    payload: ShippingRateMutationPayload,
  ) => Promise<ShippingRate>;
}) {
  const key = props.open ? props.shippingRate?.id ?? "create" : "closed";
  return <ShippingRateFormSheetInner key={key} {...props} />;
}
