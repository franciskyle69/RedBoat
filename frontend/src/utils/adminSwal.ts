import Swal from "sweetalert2";

type SweetAlertIcon = "success" | "error" | "warning" | "info" | "question";

interface ConfirmDialogOptions {
  title: string;
  text: string;
  confirmText: string;
  cancelText?: string;
  icon?: SweetAlertIcon;
}

export async function confirmDialog({
  title,
  text,
  confirmText,
  cancelText = "Cancel",
  icon = "warning",
}: ConfirmDialogOptions): Promise<boolean> {
  const result = await Swal.fire({
    icon,
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    focusCancel: true,
  });

  return result.isConfirmed;
}

interface BasicAlertOptions {
  title: string;
  text: string;
}

export function successAlert({ title, text }: BasicAlertOptions) {
  return Swal.fire({
    icon: "success",
    title,
    text,
  });
}

export function errorAlert({ title, text }: BasicAlertOptions) {
  return Swal.fire({
    icon: "error",
    title,
    text,
  });
}
