export function isBlank(value) {
  return String(value ?? '').trim() === '';
}

export function isPositiveDecimal(value) {
  const text = String(value ?? '').trim();
  const number = Number(text);

  return text !== '' && Number.isFinite(number) && number > 0;
}

export function isPositiveDecimalOrBlank(value) {
  return isBlank(value) || isPositiveDecimal(value);
}

export function isPositiveInteger(value) {
  const text = String(value ?? '').trim();
  const number = Number(text);

  return /^\d+$/.test(text) && Number.isSafeInteger(number) && number > 0;
}

export function isPositiveIntegerOrBlank(value) {
  return isBlank(value) || isPositiveInteger(value);
}
