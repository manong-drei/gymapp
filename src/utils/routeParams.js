export function getSingleParam(value) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export function getNumericParam(value) {
  const singleValue = getSingleParam(value);
  const number = Number(singleValue);

  return Number.isNaN(number) ? null : number;
}
