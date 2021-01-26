require('dotenv').config();
import express from 'express';
import { FullServiceHandlers } from './types';
import { configureLogger, logger } from './log';
import { handlers as ethHandler } from './implementations/eth';
// import NodeCache from 'node-cache';
// import { Mutex } from 'async-mutex';

if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'local_with_logger') {
  configureLogger(
    process.env.APEX_URL,
    process.env.APEX_AUTH,
    process.env.APEX_PROJECT,
    process.env.NET,
    process.env.SERVICE,
  );
}

const app = express();
app.use(express.json());

// TODO: Fill whitelist
const tokenWhitelist = new Map<string, boolean>();

const erc20Handler: FullServiceHandlers = {} as FullServiceHandlers;

function getHandlerForSymbol(symbol: string): FullServiceHandlers | null {
  if (symbol === 'ETH') return ethHandler;
  else if (tokenWhitelist.has(symbol)) return erc20Handler;
  else return null;
}

app.get('/:symbol/oracle/transactionInfo', async (req, res) => {
  const handler = getHandlerForSymbol(req.params.symbol);
  if (handler === null) return res.status(400).json({ status: 'UNSUPPORTED_SYMBOL' });
  const { reference, poolAddress } = req.query;
  logger.info('Called /oracle/transactionInfo', { reference, poolAddress });
  if (!reference || !poolAddress) return res.status(400).json({ status: 'MISSING_PARAMS' });
  const result = await handler.oracle.getTransactionInformation(reference as string, poolAddress as string);
  return res.json(result);
});

app.post('/:symbol/oracle/validateSignature', async (req, res) => {
  const handler = getHandlerForSymbol(req.params.symbol);
  if (handler === null) return res.status(400).json({ status: 'UNSUPPORTED_SYMBOL' });
  const { message, address, signature } = req.body;
  logger.info('Called /oracle/validateSignature', { msg: message, address, signature });
  if (!message || !address || !signature) {
    return res.status(400).json({ status: 'MISSING_BODY' });
  }
  const result = await handler.oracle.validateSignature(message as string, address, signature as string )
  return res.json(result);
});

app.post('/:symbol/tx/create', async (req, res) => {
  const handler = getHandlerForSymbol(req.params.symbol);
  if (handler === null) return res.status(400).json({ status: 'UNSUPPORTED_SYMBOL' });
  const { transactionData } = req.body;
  logger.info('Called /tx/create');
  if (!transactionData) {
    return res.status(400).json({ status: 'MISSING_BODY' });
  }
  const result = await handler.transactionService.createTransaction(transactionData)
  // TODO: Use correct status codes
  return res.json(result);
});

app.post('/:symbol/tx/signAndSend', async (req, res) => {
  const handler = getHandlerForSymbol(req.params.symbol);
  if (handler === null) return res.status(400).json({ status: 'UNSUPPORTED_SYMBOL' });
  const { partialTx, signatures, tosign } = req.body;
  logger.info('Called /tx/signAndSend');
  if (!partialTx || !signatures || !tosign) {
    return res.status(400).json({ status: 'MISSING_BODY' });
  }
  const result = await handler.transactionService.signAndSendTransaction(partialTx, tosign, signatures);
  return res.json(result);
});

const port = process.env.PORT || 4000;
app.listen(port);
logger.info(`Service listening on port ${port}`);
