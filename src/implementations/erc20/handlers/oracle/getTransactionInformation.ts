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
    if (res.data && res.data.transaction) {
      const receivedAmount =
        res.data.transaction.receiver.toLowerCase() === poolAddress.toLowerCase() ? res.data.transaction.amount : 0;
      return { status: 'ACCEPTED', receivedAmount, sender: [res.data.transaction.sender] };
    } else {
      return { status: 'NOT_ACCEPTED' };
    }
  } catch (error) {
    logger.warn('Error ERC20 getTransactionInformation', { error });
    return { status: 'ERROR' };
  }
}
