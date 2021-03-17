import { TransactionInformation } from '../../../../types';
import * as eth from '../../../../common/eth';
import { logger } from '../../../../log';
import { BigNumber } from 'ethers';

const REQUIRED_CONFIRMATIONS = process.env.REQUIRED_CONFIRMATIONS || '12';
function hasEnoughConfirmations(currentBlock: string, txBlock: string): boolean {
  const diff = BigNumber.from(currentBlock).sub(BigNumber.from(txBlock));
  console.log('block diff', diff.toString());
  return diff.gte(BigNumber.from(REQUIRED_CONFIRMATIONS));
}

export async function getTransactionInformation(
  txReference: string,
  poolAddress: string,
): Promise<TransactionInformation> {
  try {
    const txInfo = await eth.getTransactionByHash(txReference);
    const blockNumber = await eth.getBlockNumber();
    if (txInfo === null || blockNumber === null) return { status: 'ERROR' };
    if (txInfo.blockNumber && hasEnoughConfirmations(blockNumber, txInfo.blockNumber)) {
      const receivedAmount = txInfo.to.toLowerCase() === poolAddress.toLowerCase() ? txInfo.amount : '0';
      return { status: 'ACCEPTED', receivedAmount, sender: [txInfo.from] };
    } else {
      return { status: 'PENDING' };
    }
  } catch (error) {
    console.log(error);
    logger.info('Error ETH getTransactionInformation', { error });
    return { status: 'ERROR' };
  }
}
