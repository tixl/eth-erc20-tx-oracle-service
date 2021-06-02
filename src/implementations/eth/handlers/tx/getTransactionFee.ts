import * as eth from '../../../../common/eth'
import { BigNumber } from 'ethers';

export async function getTransactionFee(){
    const gasPrice = await eth.getGasPrice();
    if (!gasPrice) throw 'Failed to get gas price';
    const gasAmount = BigNumber.from('21000').mul(130).div(100);
    const totalGas = gasPrice.mul(gasAmount).mul;
    return { symbol: 'ETH', amount: totalGas.toString() };
}