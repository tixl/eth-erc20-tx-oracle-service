import { recoverAddress } from '@ethersproject/transactions';
import { logger } from '../log';

export async function verifySignature(
  message: string,
  address: string | string[],
  signature: string,
): Promise<boolean> {
  try {
    const signer = recoverAddress(message, signature);
    if (Array.isArray(address)) return address.map((x) => x.toLowerCase()).includes(signer.toLowerCase());
    else return signer.toLowerCase() === address.toLowerCase();
  } catch (error) {
    logger.warn('Error in verifySignature', { error });
    console.log(error);
    return false;
  }
}
