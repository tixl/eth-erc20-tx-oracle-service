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

async function createSingleTransaction(txData: AssetTransactionData, nonce: number, gasPrice: BigNumber) {
  const gasLimit = BigNumber.from('41395');
  const data = await eth.createErc20TransferData(txData.toAddress, txData.amount);
  const opts = {
    // gas: BigNumber.from('80000').toHexString(),
    to: '0xaFF4481D10270F50f203E0763e2597776068CBc5',
    data,
    // gasPrice: gasPrice.toHexString(),
    value: BigNumber.from('0').toHexString(),
  };
  const estimate = await eth.estimateGas(opts);
  console.log(JSON.stringify(opts));
  console.log(estimate);

  try {
    const tx: utils.UnsignedTransaction = {
      to: '0xaFF4481D10270F50f203E0763e2597776068CBc5',
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
    console.log(error);
    throw error;
  }
}
