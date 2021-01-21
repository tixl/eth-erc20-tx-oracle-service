import { TransactionInformation } from '../../../../types';

const REQUIRED_CONFIRMATIONS = process.env.REQUIRED_CONFIRMATIONS || 6;

export async function getTransactionInformation(
  txReference: string,
  poolAddress: string,
): Promise<TransactionInformation> {
  let result: TransactionInformation;
  
  return result;
}

