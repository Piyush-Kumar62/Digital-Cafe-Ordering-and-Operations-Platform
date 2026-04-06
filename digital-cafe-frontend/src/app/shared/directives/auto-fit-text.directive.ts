import {
  AfterViewInit,
  Directive,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Renderer2,
  SimpleChanges,
} from "@angular/core";

@Directive({
  selector: "[appAutoFitText]",
  standalone: true,
})
export class AutoFitTextDirective
  implements AfterViewInit, OnChanges, OnDestroy
{
  @Input() minFontPx = 14;
  @Input() maxFontPx = 48;
  @Input() autoFitGroup = "";

  private static groupMembers = new Map<string, Set<AutoFitTextDirective>>();

  private resizeObserver?: ResizeObserver;
  private mutationObserver?: MutationObserver;
  private rafId?: number;
  private bestFontPx = 14;

  constructor(
    private host: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    private ngZone: NgZone,
  ) {}

  ngAfterViewInit(): void {
    this.applyBaseStyles();
    this.registerInGroup();
    this.scheduleFit();
    this.observeResize();
    this.observeTextChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["minFontPx"] || changes["maxFontPx"]) {
      this.scheduleFit();
    }

    if (changes["autoFitGroup"] && !changes["autoFitGroup"].firstChange) {
      this.unregisterFromGroup(changes["autoFitGroup"].previousValue || "");
      this.registerInGroup();
      this.scheduleFit();
    }
  }

  ngOnDestroy(): void {
    this.unregisterFromGroup(this.autoFitGroup);
    this.resizeObserver?.disconnect();
    this.mutationObserver?.disconnect();
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
  }

  private applyBaseStyles(): void {
    const el = this.host.nativeElement;
    this.renderer.setStyle(el, "display", "block");
    this.renderer.setStyle(el, "width", "100%");
    this.renderer.setStyle(el, "max-width", "100%");
    this.renderer.setStyle(el, "white-space", "nowrap");
    this.renderer.setStyle(el, "overflow", "hidden");
    this.renderer.setStyle(el, "text-overflow", "clip");
  }

  private observeResize(): void {
    if (typeof ResizeObserver === "undefined") {
      return;
    }
    this.ngZone.runOutsideAngular(() => {
      this.resizeObserver = new ResizeObserver(() => this.scheduleFit());
      this.resizeObserver.observe(this.host.nativeElement);
      const parent = this.host.nativeElement.parentElement;
      if (parent) {
        this.resizeObserver.observe(parent);
      }
    });
  }

  private observeTextChanges(): void {
    if (typeof MutationObserver === "undefined") {
      return;
    }
    this.ngZone.runOutsideAngular(() => {
      this.mutationObserver = new MutationObserver(() => this.scheduleFit());
      this.mutationObserver.observe(this.host.nativeElement, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    });
  }

  private scheduleFit(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }

    this.ngZone.runOutsideAngular(() => {
      this.rafId = requestAnimationFrame(() => {
        this.fitText();
      });
    });
  }

  private fitText(): void {
    const el = this.host.nativeElement;
    const min = Math.max(8, Math.floor(this.minFontPx));
    const max = Math.max(min, Math.floor(this.maxFontPx));

    let low = min;
    let high = max;
    let best = min;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      this.renderer.setStyle(el, "font-size", `${mid}px`);

      if (this.isTextFitting(el)) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    this.bestFontPx = best;

    if (!this.autoFitGroup) {
      this.applyFontSize(best);
      return;
    }

    const members = AutoFitTextDirective.groupMembers.get(this.autoFitGroup);
    if (!members || members.size === 0) {
      this.applyFontSize(best);
      return;
    }

    let sharedSize = best;
    for (const member of members) {
      sharedSize = Math.min(sharedSize, member.bestFontPx || best);
    }

    for (const member of members) {
      member.applyFontSize(sharedSize);
    }
  }

  private isTextFitting(el: HTMLElement): boolean {
    const widthFits = el.scrollWidth <= el.clientWidth + 1;
    const heightFits = el.scrollHeight <= el.clientHeight + 1;
    return widthFits && heightFits;
  }

  private applyFontSize(size: number): void {
    this.renderer.setStyle(this.host.nativeElement, "font-size", `${size}px`);
  }

  private registerInGroup(): void {
    if (!this.autoFitGroup) {
      return;
    }

    const key = this.autoFitGroup.trim();
    if (!key) {
      return;
    }

    const members = AutoFitTextDirective.groupMembers.get(key) ?? new Set();
    members.add(this);
    AutoFitTextDirective.groupMembers.set(key, members);
  }

  private unregisterFromGroup(group: string): void {
    const key = (group || "").trim();
    if (!key) {
      return;
    }

    const members = AutoFitTextDirective.groupMembers.get(key);
    if (!members) {
      return;
    }

    members.delete(this);
    if (members.size === 0) {
      AutoFitTextDirective.groupMembers.delete(key);
    }
  }
}
