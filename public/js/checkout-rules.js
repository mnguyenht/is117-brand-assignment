// Shipping-form rules shared by the checkout page and the unit tests.
// The database function place_order() checks the same limits again.

const FIELDS = {
  fullName: { label: "full name", max: 100 },
  address: { label: "street address", max: 200 },
  city: { label: "city", max: 100 },
  postalCode: { label: "postal code", max: 12, pattern: /^[A-Za-z0-9 -]+$/ },
  country: { label: "country", max: 60 },
};

export const SHIPPING_FIELDS = Object.keys(FIELDS);

export function validateShipping(input = {}) {
  const value = {};
  const errors = {};
  for (const [name, rule] of Object.entries(FIELDS)) {
    const text = String(input[name] ?? "").trim();
    value[name] = text;
    if (!text) errors[name] = `Please enter your ${rule.label}.`;
    // eslint-disable-next-line no-control-regex -- rejecting them is the point
    else if (/[\u0000-\u001f\u007f]/.test(text))
      errors[name] = `Please keep your ${rule.label} on one line.`;
    else if (text.length > rule.max)
      errors[name] =
        `Please keep your ${rule.label} under ${rule.max} characters.`;
    else if (rule.pattern && !rule.pattern.test(text))
      errors[name] =
        `Use letters, numbers, spaces or dashes for your ${rule.label}.`;
  }
  return { ok: Object.keys(errors).length === 0, errors, value };
}
