import { CreateTransactionStatus, AssetTransactionData } from '../../../../types';
import { utils, BigNumber } from 'ethers';
import * as eth from '../../../../common/eth';
import keccak256 from 'keccak256';
import { logger } from '../../../../log';

export async function createTransaction(
  transactionData: AssetTransactionData[],
): Promise<{ status: CreateTransactionStatus; partialTx?: object; tosign?: string[]; failedTxIdxs?: number[] }> {
  try {
    const gasPriceRaw = await eth.getGasPrice();
    if (!gasPriceRaw) {
      logger.warn('ETH Missing gas price');
      return { status: 'ERROR' };
    }
    const gasPrice = gasPriceRaw.mul(115).div(100);
    const txCount = await eth.getTransactionCount(transactionData[0].fromAddress);
    if (isNaN(txCount)) {
      logger.warn('Invalid nonce', { nonce: txCount });
      return { status: 'ERROR' };
    }
    const transactions: {
      partialTx: utils.UnsignedTransaction;
      tosign: string;
    }[] = [];
    const failedTransactions: {
      status: string;
      isError: boolean;
      index: number;
    }[] = [];
    let index = 0;
    let currentNonce = Number(txCount);
    for (let txData of transactionData) {
      try {
        const tx = await createSingleTransaction(txData, currentNonce, gasPrice);
        if (tx) {
          transactions.push(tx);
          currentNonce++;
        }
      } catch (error) {
        if (error === 'INSUFFICIENT_AMOUNT') {
          failedTransactions.push({ status: 'INSUFFICIENT_FUNDS', isError: true, index });
        } else {
          failedTransactions.push({ status: 'ERROR', isError: true, index });
        }
      }
      index++;
    }

    return {
      status: 'OK',
      partialTx: transactions.map((x) => x.partialTx),
      tosign: transactions.map((x) => x.tosign),
      failedTxIdxs: failedTransactions.map((x) => x.index),
    };
  } catch (error) {
    logger.warn('Error in create transaction', { error });
    if (error === 'INSUFFICIENT_AMOUNT') {
      return { status: 'INSUFFICIENT_FUNDS' };
    }
    return { status: 'ERROR' };
  }
}

async function createSingleTransaction(data: AssetTransactionData, nonce: number, gasPrice: BigNumber) {
  const gasLimit = BigNumber.from('21000');
  const totalGas = gasLimit.mul(gasPrice);
  const value = BigNumber.from(data.amount).sub(totalGas);
  if (value.isNegative()) {
    logger.warn('Single ETH transaciton has not enough value', { data });
    throw 'INSUFFICIENT_AMOUNT';
  }
  try {
    const tx: utils.UnsignedTransaction = {
      to: data.toAddress,
      nonce,
      gasLimit: gasLimit.toHexString(),
      gasPrice: gasPrice.toHexString(),
      value: value.toHexString(),
      data: '0x',
      chainId: process.env.CHAIN_ID ? Number(process.env.CHAIN_ID) : 0,
    };
    const serialized = utils.serializeTransaction(tx);
    const hash = '0x' + keccak256(serialized).toString('hex');
    return { partialTx: tx, tosign: hash.substr(2) };
  } catch (error) {
    logger.warn('Error in ETH create single Transaction', { error });
    throw error;
  }
}
