/** Form select value → catalog id for the dependent query; empty means "not chosen yet". */
export function toSelectedId(value: string): number | undefined {
  return value === '' ? undefined : Number(value);
}
