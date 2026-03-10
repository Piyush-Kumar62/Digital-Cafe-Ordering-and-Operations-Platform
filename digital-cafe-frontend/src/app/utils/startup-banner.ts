export function showStartupBanner(): void {
  // Keep startup logging safe in all environments.
  if (typeof console === "undefined") {
    return;
  }
  console.info("Digital Cafe frontend started");
}
