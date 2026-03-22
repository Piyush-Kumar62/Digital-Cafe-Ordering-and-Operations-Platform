import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatInputModule } from "@angular/material/input";
import { Subject } from "rxjs";
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  switchMap,
  takeUntil,
  tap,
} from "rxjs/operators";
import {
  PostalLookupResponse,
  PostalPincodeService,
} from "../../services/postal-pincode.service";

type AddressControlKey =
  | "street"
  | "plotNumber"
  | "city"
  | "state"
  | "pincode"
  | "country";

@Component({
  selector: "app-address-form",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatAutocompleteModule, MatInputModule],
  templateUrl: "./address-form.component.html",
  styleUrl: "./address-form.component.scss",
})
export class AddressFormComponent implements OnInit, OnDestroy {
  @Input({ required: true }) public form!: FormGroup;
  @Input() public variant: "register" | "profile" | "cafe" = "register";
  @Input() public showPlotNumber = true;
  @Input() public streetLabel = "Street Address";
  @Input() public plotLabel = "House / Plot Number";
  @Input() public formSubmitted = false;
  @Input() public controlMap: Partial<Record<AddressControlKey, string>> = {};

  public lookupStatus: "idle" | "loading" | "success" | "not_found" | "error" =
    "idle";
  public cityOptions: string[] = [];
  public stateOptions: string[] = [];
  public cityReadonly = false;
  public stateReadonly = false;

  private readonly destroy$ = new Subject<void>();

  constructor(private postalService: PostalPincodeService) {}

  ngOnInit(): void {
    if (!this.form) return;
    this.setupPincodeLookup();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public get isRegisterVariant(): boolean {
    return this.variant === "register";
  }

  public get isCafeVariant(): boolean {
    return this.variant === "cafe";
  }

  public get cityStateDisabled(): boolean {
    return this.lookupStatus === "idle" || this.lookupStatus === "loading";
  }

  public get pincodeLoading(): boolean {
    return this.lookupStatus === "loading";
  }

  public controlName(key: AddressControlKey): string {
    return this.controlMap[key] || key;
  }

  public showError(controlKey: AddressControlKey): boolean {
    const control = this.form.get(this.controlName(controlKey));
    return !!(
      control &&
      control.invalid &&
      (control.dirty || control.touched || this.formSubmitted)
    );
  }

  private setupPincodeLookup(): void {
    const control = this.form.get(this.controlName("pincode"));
    if (!control) return;

    control.valueChanges
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        tap((value) => {
          const pin = String(value ?? "").trim();
          if (pin.length < 6) {
            this.resetLookup();
          }
        }),
        filter((value) => /^[0-9]{6}$/.test(String(value ?? "").trim())),
        tap(() => {
          this.lookupStatus = "loading";
          this.clearCityState();
        }),
        switchMap((pin) =>
          this.postalService.lookupPincode(String(pin ?? "").trim()),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe((result: PostalLookupResponse) => {
        if (result.status === "success") {
          this.lookupStatus = "success";
          this.cityOptions = result.data.cities;
          this.stateOptions = result.data.states;
          this.cityReadonly = result.data.cities.length === 1;
          this.stateReadonly = result.data.states.length === 1;

          const cityControl = this.form.get(this.controlName("city"));
          const stateControl = this.form.get(this.controlName("state"));

          if (
            cityControl &&
            result.data.cities.length === 1 &&
            !cityControl.value
          ) {
            cityControl.setValue(result.data.cities[0]);
          }

          if (
            stateControl &&
            result.data.states.length === 1 &&
            !stateControl.value
          ) {
            stateControl.setValue(result.data.states[0]);
          }
          return;
        }

        if (result.status === "not_found") {
          this.lookupStatus = "not_found";
          this.cityOptions = [];
          this.stateOptions = [];
          this.cityReadonly = false;
          this.stateReadonly = false;
          return;
        }

        this.lookupStatus = "error";
        this.cityOptions = [];
        this.stateOptions = [];
        this.cityReadonly = false;
        this.stateReadonly = false;
      });
  }

  private resetLookup(): void {
    this.lookupStatus = "idle";
    this.cityOptions = [];
    this.stateOptions = [];
    this.cityReadonly = false;
    this.stateReadonly = false;
    this.clearCityState();
  }

  private clearCityState(): void {
    const cityControl = this.form.get(this.controlName("city"));
    const stateControl = this.form.get(this.controlName("state"));
    if (cityControl) cityControl.setValue("");
    if (stateControl) stateControl.setValue("");
  }
}
