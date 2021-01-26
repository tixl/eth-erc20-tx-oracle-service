import { CreateTransactionStatus, AssetTransactionData } from '../../../../types';
import { utils, BigNumber } from 'ethers';
import * as eth from '../../../../common/eth';
import keccak256 from 'keccak256';
import { logger } from '../../../../log';
import axios from 'axios';

export async function createTransaction(
  transactionData: AssetTransactionData[],
): Promise<{ status: CreateTransactionStatus; partialTx?: object; tosign?: string[] }> {
  try {
    const gasInfo = await axios.get(
      `https://ethgasstation.info/api/ethgasAPI.json?api-key=${process.env.ETHGASSTATION_APIKEY}`,
    );
    if (!gasInfo) {
      logger.warn('Missing gas info');
      return { status: 'ERROR' };
    }
    const gasPrice = BigNumber.from(gasInfo.data.average).mul(BigNumber.from('100000000'));
    const txCount = await eth.getTransactionCount(transactionData[0].fromAddress);
    if (isNaN(txCount)) {
      logger.warn('Invalid nonce', { nonce: txCount });
      return { status: 'ERROR' };
    }
    const transactions = await Promise.all(
      transactionData.map((data, i) => createSingleTransaction(data, Number(txCount) + i, gasPrice)),
    );
    return { status: 'OK', partialTx: transactions.map((x) => x.partialTx), tosign: transactions.map((x) => x.tosign) };
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
    return { partialTx: tx, tosign: hash };
  } catch (error) {
    logger.warn('Error in create single Transaction', { error });
    throw error;
  }
}
