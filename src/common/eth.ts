import Eth from 'ethjs';
import converter from 'hex2dec';
import axios from 'axios';
import { BigNumber } from 'ethers';
import { Mutex } from 'async-mutex';
import { logger } from '../log';

const eth = new Eth(new Eth.HttpProvider(process.env.INFURA));

export async function getTransactionByHash(
  hash: string,
): Promise<{ from: string; to: string; amount: string; blockNumber: string | null; input: string } | null> {
  const result = await eth.getTransactionByHash(hash);
  if (!result) return null;
  else
    return {
      from: result.from,
      to: result.to,
      input: result.input,
      amount: result.value.toString(10, 0),
      blockNumber: result.blockNumber ? result.blockNumber.toString(10, 0) : null,
    };
}

export async function getBlockNumber(): Promise<string | null> {
  const result = await eth.blockNumber();
  if (!result) return null;
  return result.toString(10, 0);
}

export async function sendRawTransaction(rawTx: string): Promise<any> {
  const result = await eth.sendRawTransaction(rawTx);
  if (!result) return null;
  else return result;
}

export async function getTransactionCount(address: string): Promise<any> {
  const result = await eth.getTransactionCount(address, 'pending');
  if (!result) return null;
  else return result.toString(10);
}

export async function estimateGas(payload: {
  from?: string;
  to?: string;
  gas?: string;
  gasPrice?: string;
  value?: string;
  data?: string;
}): Promise<any> {
  try {
    const result = await eth.estimateGas(payload);
    console.log(result);
    if (!result) return null;
    else return result.toString(10);
  } catch (error) {
    console.log(error);
    return null;
  }
}

function pad32Bytes(data: string) {
  var s = String(data);
  while (s.length < (64 || 2)) {
    s = '0' + s;
  }
  return s;
}

export function createErc20TransferData(toHex: string, value: string) {
  const method = 'a9059cbb';
  const address = pad32Bytes(toHex.substring(2));
  const valueHex = pad32Bytes(converter.decToHex(value, { prefix: false }));
  return '0x' + method + address + valueHex;
}

let gasPriceCache: BigNumber | null = null;
let cacheTimestamp = 0;
const mx = new Mutex();

export async function getGasPrice(): Promise<BigNumber | null> {
  const release = await mx.acquire();
  try {
    if (Date.now() - cacheTimestamp < 15000 && gasPriceCache !== null) {
      return gasPriceCache;
    }
    const gasInfo = await axios.get(
      `https://ethgasstation.info/api/ethgasAPI.json?api-key=${process.env.ETHGASSTATION_APIKEY}`,
    );
    if (gasInfo && gasInfo.data) {
      const gasprice = BigNumber.from(gasInfo.data.fastest).mul(BigNumber.from('100000000'));
      gasPriceCache = gasprice;
      cacheTimestamp = Date.now();
      return gasprice;
    } else return null;
  } catch (error) {
    logger.error('Error in getGasPrice', { error });
    return null;
  } finally {
    release();
  }
}

export function getReceiverAndAmountFromInputData(inputData: string) {
  const receiver = `0x${inputData.slice(34, 74)}`;
  const amount = converter.hexToDec(inputData.slice(74));
  return { receiver, amount };
}

export const ERROR_TRANSACTION_NOT_FOUND = "TRANSACTION_NOT_FOUND";
export const ERROR_TRANSACTION_NOT_ERC20_TRANSFER =
  "TRANSACTION_NOT_ERC20_TRANSFER";

export async function getERC20TransferByHash(hash: string) {
  const ethTxData = await eth.getTransactionByHash(hash);
  if (ethTxData === null) throw ERROR_TRANSACTION_NOT_FOUND;
  if (
    ethTxData.input.length !== 138 ||
    ethTxData.input.slice(2, 10) !== "a9059cbb"
  ) {
    throw ERROR_TRANSACTION_NOT_ERC20_TRANSFER;
  }
  const { receiver, amount } = getReceiverAndAmountFromInputData(
    ethTxData.input
  );
  const symbol = ethTxData.to;
  const block = Number(ethTxData.blockNumber);
  const sender = ethTxData.from;
  return { receiver, amount, symbol, hash, block, sender };
}

