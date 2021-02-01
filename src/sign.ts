require('dotenv').config();
import { Wallet } from 'ethers';
import { joinSignature } from '@ethersproject/bytes';

// Used to sign things manually
(async () => {
  const w = Wallet.fromMnemonic(process.env.MNEMONIC!);
  console.log('Wallet address: ', await w.getAddress());
  const tosign = process.argv[2];
  console.log('Tosign: ', tosign);
  const signature = await w._signingKey().signDigest(tosign);
  console.log('Signature: ', joinSignature(signature));
})();
