import { TransactionInformation } from '../../../../types';
import * as eth from '../../../../common/eth';
import { logger } from '../../../../log';

export async function getTransactionInformation(
  txReference: string,
  poolAddress: string,
): Promise<TransactionInformation> {
  try {
    const txInfo = await eth.getTransactionByHash(txReference);
    if (txInfo === null) return { status: 'ERROR' };
    const receivedAmount = txInfo.to.toLowerCase() === poolAddress.toLowerCase() ? txInfo.amount : '0';
    return { status: 'ACCEPTED', receivedAmount, sender: [txInfo.from] };
  } catch (error) {
    logger.info('Error ETH getTransactionInformation', { error });
    return { status: 'ERROR' };
  }
}
