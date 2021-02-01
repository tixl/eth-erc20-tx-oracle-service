require('dotenv').config();
// import { sendErc20Token } from './common/eth';
import { Wallet } from 'ethers';
import { joinSignature } from '@ethersproject/bytes';

(async () => {
  const w = Wallet.fromMnemonic(process.env.MNEMONIC!);

  console.log('Wallet address', await w.getAddress());
  const tosign = '0xb0fbca2fa177026d39ab2155155237573fbd130fab9eead32217043f78963101';
  const signature = await w._signingKey().signDigest(tosign);
  console.log('signature', joinSignature(signature));

})();
