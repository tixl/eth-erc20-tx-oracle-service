import { TransactionInformation } from '../../../../types';
import { logger } from '../../../../log';
import * as eth from '../../../../common/eth';
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
    const transfer = await eth.getERC20TransferByHash(txReference);
    if (symbol.toLowerCase() !== transfer.symbol.toLowerCase()) {
      logger.warn('ERC20: Symbol mismatch', { symbol, txSymbol: transfer.symbol });
      return { status: 'NOT_ACCEPTED' };
    }
    const blockNumber = await eth.getBlockNumber();
    if (blockNumber === null) return { status: 'ERROR' };
    if (transfer.block && hasEnoughConfirmations(blockNumber, String(transfer.block))) {
      const receivedAmount = transfer.receiver.toLowerCase() === poolAddress.toLowerCase() ? transfer.amount : '0';
      return { status: 'ACCEPTED', receivedAmount, sender: [transfer.sender] };
    } else return { status: 'PENDING' };
  } catch (error) {
    if (error === eth.ERROR_TRANSACTION_NOT_ERC20_TRANSFER || error === eth.ERROR_TRANSACTION_NOT_FOUND) {
      return { status: 'NOT_ACCEPTED' };
    }
    logger.warn('Error ERC20 getTransactionInformation', { error });
    return { status: 'ERROR' };
  }
}
