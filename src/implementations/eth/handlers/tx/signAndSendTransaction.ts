import { SignAndSendResponse } from '../../../../types';
// import * as eth from '../../../../common/eth';
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
  try {
    const txs = partialTx.map((partialTx, i) => {
      const signature = '0x' + signatures[i];
      const withSignature = utils.serializeTransaction(partialTx, signature);
      return withSignature;
    });
    txs.forEach((tx) => logger.info('Serialized Transaction, not sending to network', { tx }));
    // const hashes = await Promise.all(txs.map(eth.sendRawTransaction));
    const hashes = txs.map((_) => '0x00000000000000000000000000000');
    return { status: 'OK', hash: hashes };
  } catch (error) {
    logger.warn('Error in ETH signAndSendTransaction', { error });
    return { status: 'ERROR' };
  }
}
