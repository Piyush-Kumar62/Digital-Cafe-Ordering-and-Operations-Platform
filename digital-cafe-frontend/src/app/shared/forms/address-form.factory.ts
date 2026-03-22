import { ValidatorFn, Validators } from "@angular/forms";

export type AddressFormOptions = {
  includeCountry?: boolean;
  requireState?: boolean;
  requirePlot?: boolean;
  pincodePattern?: RegExp;
  maxLengths?: {
    street?: number;
    plotNumber?: number;
    city?: number;
    state?: number;
    country?: number;
    pincode?: number;
  };
};

export type AddressControlsConfig = Record<string, [any, ValidatorFn[]]>;

export function buildAddressControls(
  options: AddressFormOptions = {},
): AddressControlsConfig {
  const max = {
    street: options.maxLengths?.street ?? 200,
    plotNumber: options.maxLengths?.plotNumber ?? 50,
    city: options.maxLengths?.city ?? 100,
    state: options.maxLengths?.state ?? 100,
    country: options.maxLengths?.country ?? 100,
    pincode: options.maxLengths?.pincode ?? 6,
  };

  const stateValidators: ValidatorFn[] = [Validators.maxLength(max.state)];
  if (options.requireState !== false) {
    stateValidators.unshift(Validators.required);
  }

  const pincodeValidators: ValidatorFn[] = [
    Validators.required,
    Validators.maxLength(max.pincode),
  ];

  const pattern = options.pincodePattern ?? /^[0-9]{6}$/;
  if (pattern) {
    pincodeValidators.push(Validators.pattern(pattern));
  }

  const controls: AddressControlsConfig = {
    street: [
      "",
      [Validators.required, Validators.minLength(3), Validators.maxLength(max.street)],
    ],
    plotNumber: [
      "",
      [
        ...(options.requirePlot ? [Validators.required] : []),
        Validators.maxLength(max.plotNumber),
      ],
    ],
    city: ["", [Validators.required, Validators.maxLength(max.city)]],
    state: ["", stateValidators],
    pincode: ["", pincodeValidators],
  };

  if (options.includeCountry) {
    controls["country"] = ["India", [Validators.maxLength(max.country)]];
  }

  return controls;
}
