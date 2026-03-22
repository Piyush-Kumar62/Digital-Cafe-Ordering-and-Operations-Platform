import { FormBuilder } from "@angular/forms";
import { buildAddressControls } from "./address-form.factory";

describe("buildAddressControls", () => {
  const fb = new FormBuilder();

  it("should make plot number optional by default", () => {
    const form = fb.group(buildAddressControls());
    form.patchValue({
      street: "Main Road",
      city: "Mumbai",
      state: "MH",
      pincode: "400001",
    });

    expect(form.get("plotNumber")?.valid).toBeTrue();
    expect(form.valid).toBeTrue();
  });

  it("should require plot number when configured", () => {
    const form = fb.group(buildAddressControls({ requirePlot: true }));
    form.patchValue({
      street: "Main Road",
      city: "Mumbai",
      state: "MH",
      pincode: "400001",
    });

    expect(form.get("plotNumber")?.valid).toBeFalse();
    form.get("plotNumber")?.setValue("12A");
    expect(form.get("plotNumber")?.valid).toBeTrue();
  });

  it("should validate pincode with 6 digits by default", () => {
    const form = fb.group(buildAddressControls());
    form.patchValue({
      street: "Main Road",
      city: "Mumbai",
      state: "MH",
      plotNumber: "12A",
      pincode: "1234",
    });

    expect(form.get("pincode")?.valid).toBeFalse();
    form.get("pincode")?.setValue("400001");
    expect(form.get("pincode")?.valid).toBeTrue();
  });

  it("should include country when requested", () => {
    const form = fb.group(buildAddressControls({ includeCountry: true }));
    expect(form.get("country")).toBeTruthy();
  });
});
