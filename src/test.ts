require('dotenv').config();
import { Wallet } from 'ethers';
import { joinSignature } from '@ethersproject/bytes';

(async () => {
  const w = Wallet.fromMnemonic(process.env.MNEMONIC!);

  console.log('Wallet address', await w.getAddress());
  const tosign = '0x6a575b50f9947c02f225b34df5d0d79bdd1ef6859a11cf989b1d3b1d4b0b5308';
  const signature = await w._signingKey().signDigest(tosign);
  console.log('signature', joinSignature(signature));
})();
