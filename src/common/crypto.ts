import { utils } from 'ethers';

export async function verifySignature(
  message: string,
  address: string | string[],
  signature: string,
): Promise<boolean> {
  const signer = utils.verifyMessage(message, signature);
  if (Array.isArray(address)) return address.map((x) => x.toLowerCase()).includes(signer.toLowerCase());
  else return signer.toLowerCase() === address.toLowerCase();
}
