import { SignAndSendResponse } from '../../../../types';
import * as eth from '../../../../common/eth';
import { utils } from 'ethers';
import { logger } from '../../../../log';

export async function signAndSendTransaction(
  partialTx: Array<utils.UnsignedTransaction>,
  tosign: string[],
  signatures: string[],
): Promise<SignAndSendResponse> {
  if (partialTx.length !== tosign.length || tosign.length !== signatures.length) {
    return { status: 'INVALID_SIGNATURES' };
  }
  const txs = partialTx.map((partialTx, i) => {
    const signature = signatures[i];
    const withSignature = utils.serializeTransaction(partialTx, signature);
    return withSignature;
  });
  try {
    const hashes = await Promise.all(txs.map(eth.sendRawTransaction));
    return { status: 'OK', hash: hashes };
  } catch (error) {
    logger.warn('Error in ERC20 signAndSendTransaction', { error });
    return { status: 'ERROR' };
  }
}
