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

export function isTargetSetCountOrBlank(value) {
  if (isBlank(value)) {
    return true;
  }

  const text = String(value).trim();
  const number = Number(text);

  return /^\d+$/.test(text) && Number.isSafeInteger(number) && number >= 1 && number <= 20;
}

export function isRepTargetOrBlank(value) {
  if (isBlank(value)) {
    return true;
  }

  const text = String(value).trim();

  if (!/^\d+(-\d+)?$/.test(text)) {
    return false;
  }

  if (!text.includes('-')) {
    return isPositiveInteger(text);
  }

  const [minReps, maxReps] = text.split('-').map(Number);
  return (
    Number.isSafeInteger(minReps) &&
    Number.isSafeInteger(maxReps) &&
    minReps > 0 &&
    maxReps >= minReps
  );
}
