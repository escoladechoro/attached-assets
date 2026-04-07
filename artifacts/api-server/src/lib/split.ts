const PAYMENT_FEES: Record<string, number> = {
  pix: 0,
  cash: 0,
  debit: 0.02,
  credit: 0.035,
};

export function calculateSplit(
  grossAmount: number,
  paymentMethod: string,
  clinicSharePercent: number = 30,
  professionalSharePercent: number = 70
): {
  gateFee: number;
  netAmount: number;
  clinicAmount: number;
  professionalAmount: number;
} {
  const feeRate = PAYMENT_FEES[paymentMethod] ?? 0;
  const gateFee = parseFloat((grossAmount * feeRate).toFixed(2));
  const netAmount = parseFloat((grossAmount - gateFee).toFixed(2));
  const clinicAmount = parseFloat((netAmount * (clinicSharePercent / 100)).toFixed(2));
  const professionalAmount = parseFloat((netAmount * (professionalSharePercent / 100)).toFixed(2));

  return { gateFee, netAmount, clinicAmount, professionalAmount };
}
