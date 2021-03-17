import { TransactionInformation } from '../../../../types';
import { logger } from '../../../../log';
import * as eth from '../../../../common/eth';
import axios from 'axios';
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
  symbol?: string,
): Promise<TransactionInformation> {
  if (!symbol) return { status: 'ERROR' };
  try {
    const res = await axios.get(`${process.env.ERC20_API}/${symbol}/hash/${txReference}`);
    const blockNumber = await eth.getBlockNumber();
    if (blockNumber === null) return { status: 'ERROR' };
    if (res.data && res.data.transaction) {
      if (res.data.transaction.block && hasEnoughConfirmations(blockNumber, String(res.data.transaction.block))) {
        const receivedAmount =
          res.data.transaction.receiver.toLowerCase() === poolAddress.toLowerCase() ? res.data.transaction.amount : 0;
        return { status: 'ACCEPTED', receivedAmount, sender: [res.data.transaction.sender] };
      } else return { status: 'PENDING' };
    } else {
      return { status: 'NOT_ACCEPTED' };
    }
  } catch (error) {
    logger.warn('Error ERC20 getTransactionInformation', { error });
    return { status: 'ERROR' };
  }
}
