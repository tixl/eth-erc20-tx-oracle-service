import { CreateTransactionStatus, AssetTransactionData } from '../../../../types';

export async function createTransaction(
  transactionData: AssetTransactionData[],
): Promise<{ status: CreateTransactionStatus; partialTx?: object; tosign?: string[] }> {
  const poolAddress = process.env.POOL_ADDRESS;
}
