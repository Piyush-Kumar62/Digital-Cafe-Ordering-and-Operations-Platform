import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  Renderer2,
} from "@angular/core";
import {
  sanitizeNoWhitespace,
  sanitizeNormalizeWhitespace,
  sanitizeTrimEdges,
} from "@shared/utils/input-sanitizer.util";

@Directive({
  selector: "[appTrimInput]",
  standalone: true,
})
export class TrimInputDirective {
  @Input() appTrimInput:
    | "trim"
    | "no-whitespace"
    | "normalize-whitespace"
    | "" = "trim";

  constructor(
    private readonly host: ElementRef<HTMLInputElement | HTMLTextAreaElement>,
    private readonly renderer: Renderer2,
  ) {}

  @HostListener("blur")
  onBlur(): void {
    this.trimAndSync();
  }

  @HostListener("paste")
  onPaste(): void {
    // Allow native paste, then normalize immediately.
    this.scheduleNormalize();
  }

  @HostListener("input")
  onInput(): void {
    this.trimAndSync();
    this.scheduleNormalize();
  }

  @HostListener("change")
  onChange(): void {
    this.trimAndSync();
  }

  private trimAndSync(): void {
    const element = this.host.nativeElement;
    const currentValue = String(element.value ?? "");
    const trimmedValue =
      this.appTrimInput === "no-whitespace"
        ? sanitizeNoWhitespace(currentValue)
        : this.appTrimInput === "normalize-whitespace"
          ? sanitizeNormalizeWhitespace(currentValue)
          : sanitizeTrimEdges(currentValue);

    if (currentValue === trimmedValue) {
      return;
    }

    this.renderer.setProperty(element, "value", trimmedValue);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  }

  private scheduleNormalize(): void {
    queueMicrotask(() => this.trimAndSync());
    setTimeout(() => this.trimAndSync(), 0);
  }
}
