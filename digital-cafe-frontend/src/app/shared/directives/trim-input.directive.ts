import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  Renderer2,
} from "@angular/core";

@Directive({
  selector: "[appTrimInput]",
  standalone: true,
})
export class TrimInputDirective {
  @Input() appTrimInput: "trim" | "no-whitespace" | "" = "trim";

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
    // Wait until pasted text lands in the input, then normalize it.
    setTimeout(() => this.trimAndSync());
  }

  @HostListener("input")
  onInput(): void {
    if (this.appTrimInput === "no-whitespace") {
      this.trimAndSync();
    }
  }

  private trimAndSync(): void {
    const element = this.host.nativeElement;
    const currentValue = String(element.value ?? "");
    const trimmedValue =
      this.appTrimInput === "no-whitespace"
        ? currentValue.replace(/\s+/g, "")
        : currentValue.trim();

    if (currentValue === trimmedValue) {
      return;
    }

    this.renderer.setProperty(element, "value", trimmedValue);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  }
}
