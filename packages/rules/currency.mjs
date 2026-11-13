/** MONEY-001. Shared by web and generated Figma plugin; never coerce invalid/missing values to zero. */
export function currency(value) {
  if (value === null || value === undefined || (typeof value === "string" && !value.trim())) return "—";
  if (typeof value !== "number" && typeof value !== "string") throw new TypeError("Invalid currency type");
  if (typeof value === "string" && !/^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(value.trim())) throw new TypeError("Invalid currency value");
  const number = typeof value === "number" ? value : Number(value.trim().replaceAll(",", ""));
  if (!Number.isFinite(number)) throw new TypeError("Invalid currency value");
  // Deterministic decimal rounding in both browser and Figma sandbox (no Intl dependency).
  let raw = typeof value === "number" ? String(value) : value.trim().replaceAll(",", "");
  const negative = raw.startsWith("-"); raw = raw.replace(/^-/, "");
  if (/[eE]/.test(raw)) {
    const [mantissa, exponent] = raw.toLowerCase().split("e");
    const parts = mantissa.split("."); const digits = parts.join("");
    const position = parts[0].length + Number(exponent);
    raw = position <= 0 ? "0." + "0".repeat(-position) + digits : position >= digits.length ? digits + "0".repeat(position - digits.length) : digits.slice(0, position) + "." + digits.slice(position);
  }
  const [whole, fraction = ""] = raw.split(".");
  let cents = BigInt(whole) * 100n + BigInt(fraction.slice(0, 2).padEnd(2, "0"));
  if (fraction.length > 2 && fraction[2] >= "5") cents += 1n;
  const integer = (cents / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (negative && cents > 0n ? "-" : "") + integer + "." + (cents % 100n).toString().padStart(2, "0");
}
