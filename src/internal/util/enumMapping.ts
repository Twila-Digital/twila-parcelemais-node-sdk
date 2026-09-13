export function enumFromWireValue<E extends Record<string, number | string>>(
  enumObject: E,
  value: number,
  unknownMember: E[keyof E],
): E[keyof E] {
  const isDefined = Object.values(enumObject).some((member) => typeof member === 'number' && member === value);
  return isDefined ? (value as E[keyof E]) : unknownMember;
}
