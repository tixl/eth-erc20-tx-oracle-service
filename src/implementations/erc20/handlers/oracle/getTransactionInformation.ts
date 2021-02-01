import { TransactionInformation } from '../../../../types';
import { logger } from '../../../../log';
import axios from 'axios';

export async function getTransactionInformation(
  txReference: string,
  poolAddress: string,
  symbol?: string,
): Promise<TransactionInformation> {
  if (!symbol) return { status: 'ERROR' };
  try {
    const res = await axios.get(`${process.env.ERC20_API}/${symbol}/hash/${txReference}`);
    if (res.data) {
      if (!res.data.transaction) {
        return { status: 'NOT_ACCEPTED' };
      } else {
        const receivedAmount = res.data.transaction.receiver === poolAddress ? res.data.transaction.amount : 0;
        return { status: 'ACCEPTED', receivedAmount, sender: [res.data.transaction.sender] };
      }
    } else {
      return { status: 'ERROR' };
    }
  } catch (error) {
    logger.info('Error getTransactionInformation', { error });
    return { status: 'ERROR' };
  }
}
