import { DOCUMENT } from "@angular/common";
import { Inject, Injectable } from "@angular/core";
import { ThemeService } from "@core/services/theme.service";
import Swal, { SweetAlertOptions, SweetAlertResult } from "sweetalert2";

@Injectable({
  providedIn: "root",
})
export class AlertService {
  private lastAlertKey = "";
  private lastAlertAt = 0;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private themeService: ThemeService,
  ) {}

  success(title: string, message?: string): void {
    if (!this.shouldDisplay("success", title, message ?? "")) return;
    void Swal.fire({
      ...this.swalOpts("success"),
      title,
      text: message,
      icon: "success",
      confirmButtonText: "Got it",
    });
  }

  error(title: string, message?: string): void {
    if (!this.shouldDisplay("error", title, message ?? "")) return;
    void Swal.fire({
      ...this.swalOpts("error"),
      title,
      text: message,
      icon: "error",
      confirmButtonText: "OK",
    });
  }

  warning(title: string, message?: string): void {
    if (!this.shouldDisplay("warning", title, message ?? "")) return;
    void Swal.fire({
      ...this.swalOpts("warning"),
      title,
      text: message,
      icon: "warning",
      confirmButtonText: "OK",
    });
  }

  info(title: string, message?: string): void {
    if (!this.shouldDisplay("info", title, message ?? "")) return;
    void Swal.fire({
      ...this.swalOpts("info"),
      title,
      text: message,
      icon: "info",
      confirmButtonText: "OK",
    });
  }

  async confirm(title: string, message: string): Promise<boolean> {
    const result: SweetAlertResult = await Swal.fire({
      ...this.swalOpts("confirm"),
      title,
      text: message,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Confirm",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      allowOutsideClick: false,
      allowEscapeKey: false,
    });
    return result.isConfirmed;
  }

  /** Shows a success dialog that requires an explicit button click before resolving. */
  async successWithButton(
    title: string,
    message: string,
    buttonText = "Continue",
  ): Promise<void> {
    await Swal.fire({
      ...this.swalOpts("success"),
      title,
      text: message,
      icon: "success",
      confirmButtonText: buttonText,
      allowOutsideClick: false,
      allowEscapeKey: false,
    });
  }

  loading(message: string): void {
    Swal.fire({
      ...this.swalOpts("loading"),
      title: "Please wait…",
      text: message || "Processing your request",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });
  }

  close(): void {
    Swal.close();
  }

  private swalOpts(type: string): SweetAlertOptions {
    const dark = this.isDark();
    return {
      width: "440px",
      background: dark ? "#0f172a" : "#ffffff",
      color: dark ? "#f1f5f9" : "#0f172a",
      buttonsStyling: false,
      customClass: {
        popup: `dc-swal2-popup dc-type-${type}${dark ? " dc-swal2-dark" : ""}`,
        title: "dc-swal2-title",
        htmlContainer: "dc-swal2-body",
        confirmButton: "dc-swal2-btn-confirm",
        cancelButton: "dc-swal2-btn-cancel",
        actions: "dc-swal2-actions",
      },
    };
  }

  private isDark(): boolean {
    const root = this.document?.documentElement;
    const body = this.document?.body;
    return (
      this.themeService.isDarkMode() ||
      (!!root &&
        (root.classList.contains("dark") ||
          root.classList.contains("dark-mode"))) ||
      (!!body && body.classList.contains("dark-theme"))
    );
  }

  private shouldDisplay(type: string, title: string, text: string): boolean {
    const now = Date.now();
    const key = `${type}|${title}|${text}`;
    if (key === this.lastAlertKey && now - this.lastAlertAt < 800) return false;
    this.lastAlertKey = key;
    this.lastAlertAt = now;
    return true;
  }
}
