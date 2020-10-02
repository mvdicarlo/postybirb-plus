export function DefaultValue(defaultValue: any) {
  return (target: any, propertyKey: string) => {
    let value: any = defaultValue;
    Object.defineProperty(target, propertyKey, {
      get() {
        return value;
      },
      set(setValue: any) {
        value = setValue;
      },
    });
  };
}
