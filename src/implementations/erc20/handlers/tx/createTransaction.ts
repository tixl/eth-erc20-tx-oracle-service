import { CreateTransactionStatus, AssetTransactionData } from '../../../../types';
import { utils, BigNumber } from 'ethers';
import * as eth from '../../../../common/eth';
import keccak256 from 'keccak256';
import { logger } from '../../../../log';

export async function createTransaction(
  transactionData: AssetTransactionData[],
  symbol?: string,
): Promise<{ status: CreateTransactionStatus; partialTx?: object; tosign?: string[] }> {
  if (!symbol) {
    logger.error('Missing token symbol');
    return { status: 'ERROR' };
  }
  try {
    const gasPriceRaw = await eth.getGasPrice();
    if (!gasPriceRaw) {
      logger.warn('Missing gas price');
      return { status: 'ERROR' };
    }
    const gasPrice = gasPriceRaw.mul(140).div(100);
    const txCount = await eth.getTransactionCount(transactionData[0].fromAddress);
    if (isNaN(txCount)) {
      logger.warn('Invalid nonce', { nonce: txCount });
      return { status: 'ERROR' };
    }
    const transactions = await Promise.all(
      transactionData.map((data, i) => createSingleTransaction(data, Number(txCount) + i, gasPrice, symbol)),
    );
    return { status: 'OK', partialTx: transactions.map((x) => x.partialTx), tosign: transactions.map((x) => x.tosign.substr(2)) };
  } catch (error) {
    logger.warn('Error in ERC20 createTransaction', { error });
    return { status: 'ERROR' };
  }
}

async function createSingleTransaction(
  txData: AssetTransactionData,
  nonce: number,
  gasPrice: BigNumber,
  contract: string,
) {
  const gasLimit = BigNumber.from('100000');
  const data = await eth.createErc20TransferData(txData.toAddress, txData.amount);
  try {
    const tx: utils.UnsignedTransaction = {
      to: contract,
      nonce,
      gasLimit: gasLimit.toHexString(),
      gasPrice: gasPrice.toHexString(),
      value: BigNumber.from('0').toHexString(),
      data,
      chainId: process.env.CHAIN_ID ? Number(process.env.CHAIN_ID) : 0,
    };
    const serialized = utils.serializeTransaction(tx);
    const hash = '0x' + keccak256(serialized).toString('hex');
    return { partialTx: tx, tosign: hash };
  } catch (error) {
    logger.warn('Error in create single Transaction ERC20', { error });
    throw error;
  }
}
