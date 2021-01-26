import Eth from 'ethjs';

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
  const result = await eth.getTransactionCount(address, "latest");
  if (!result) return null;
  else return result.toString(10);
}
