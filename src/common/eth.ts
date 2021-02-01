import Eth from 'ethjs';
import converter from 'hex2dec';
const erc20abi = require('./erc20abi.json');
import axios from 'axios';
import { BigNumber } from 'ethers';

const eth = new Eth(new Eth.HttpProvider(process.env.INFURA));

export async function getTransactionByHash(hash: string): Promise<{ from: string; to: string; amount: string } | null> {
  const result = await eth.getTransactionByHash(hash);
  if (!result) return null;
  else
    return {
      from: result.from,
      to: result.to,
      amount: result.value.toString(10, 0),
    };
}

export async function sendRawTransaction(rawTx: string): Promise<any> {
  const result = await eth.sendRawTransaction(rawTx);
  if (!result) return null;
  else return result;
}

export async function getTransactionCount(address: string): Promise<any> {
  const result = await eth.getTransactionCount(address, 'latest');
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

const erc20contract = eth.contract(erc20abi);
const weenusContract = erc20contract.at('0xaFF4481D10270F50f203E0763e2597776068CBc5');
weenusContract;

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

export async function getGasPrice(): Promise<BigNumber | null> {
  const gasInfo = await axios.get(
    `https://ethgasstation.info/api/ethgasAPI.json?api-key=${process.env.ETHGASSTATION_APIKEY}`,
  );
  if (gasInfo && gasInfo.data) {
    return BigNumber.from(gasInfo.data.average).mul(BigNumber.from('100000000'));
  } else return null;
}
