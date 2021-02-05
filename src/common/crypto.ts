import { recoverAddress } from '@ethersproject/transactions';
import { logger } from '../log';
import keccak256 from 'keccak256';

export async function verifySignature(
  message: string,
  address: string | string[],
  signature: string,
): Promise<boolean> {
  try {
    const signer = recoverAddress(keccak256('\x19Ethereum Signed Message:\n' + message.length + message), signature);
    if (Array.isArray(address)) return address.map((x) => x.toLowerCase()).includes(signer.toLowerCase());
    else return signer.toLowerCase() === address.toLowerCase();
  } catch (error) {
    logger.warn('Error in verifySignature', { error });
    console.log(error);
    return false;
  }
}
