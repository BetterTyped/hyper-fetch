const format = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export const Price = ({ value }: { value: number }) => <span>{format.format(value)}</span>;
