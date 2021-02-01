import { verifySignature } from '../../../../common/crypto';
import { logger } from '../../../../log';

export async function validateSignature(
  message: string,
  address: string | string[],
  signature: string,
): Promise<boolean> {
  try {
    return verifySignature(message, address, signature);
  } catch (error) {
    logger.warn('Error validating signature', { error });
    return false;
  }
}
