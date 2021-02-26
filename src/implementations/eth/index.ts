import { FullServiceHandlers } from '../../types';
import { getTransactionInformation } from './handlers/oracle/getTransactionInformation';
import { validateSignature } from './handlers/oracle/validateSignature';
import { createTransaction } from './handlers/tx/createTransaction';
import { signAndSendTransaction } from './handlers/tx/signAndSendTransaction';
import { getTransactionFee } from './handlers/tx/getTransactionFee';

export const handlers: FullServiceHandlers = {
  oracle: {
    getTransactionInformation,
    validateSignature,
  },
  transactionService: {
    createTransaction,
    signAndSendTransaction,
    getTransactionFee,
  },
};
