const amountFormatter = new Intl.NumberFormat("es-MX", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatMoneyAmount = (value) => amountFormatter.format(Number(value) || 0);
export const formatMoney = (value) => currencyFormatter.format(Number(value) || 0);
