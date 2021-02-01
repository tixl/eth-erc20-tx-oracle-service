require('dotenv').config();
import express from 'express';
import NodeCache from 'node-cache';
import { Mutex } from 'async-mutex';
import { FullServiceHandlers, TransactionInformation, AssetTransactionData, CreateTransactionResponse } from './types';
import { configureLogger, logger } from './log';
import { handlers as ethHandler } from './implementations/eth';
import { handlers as erc20Handler } from './implementations/erc20';

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

const tokenWhitelist = new Map<string, boolean>();

const supportedTokensFromEnv = process.env.SUPPORTED_TOKENS;
if (supportedTokensFromEnv) {
  supportedTokensFromEnv.split(',').forEach((token) => tokenWhitelist.set(token.toLowerCase(), true));
}

function getHandlerForSymbol(symbol: string): FullServiceHandlers | null {
  if (symbol === 'ETH') return ethHandler;
  else if (tokenWhitelist.has(symbol.toLowerCase())) return erc20Handler;
  else return null;
}

const txInfoMx = new Mutex();
const txInfoCache = new NodeCache({ stdTTL: 10, checkperiod: 1 });

async function getTransactionInfoResult(
  handler: FullServiceHandlers,
  symbol: string,
  reference: string,
  poolAddress: string,
) {
  const release = await txInfoMx.acquire();
  try {
    const key = `${symbol}-${reference}-${poolAddress}`;
    const fromCache: TransactionInformation | undefined = txInfoCache.get(key);
    if (fromCache) {
      logger.info('Tx info delivering from cache', { key });
      return fromCache;
    } else {
      logger.info('Tx info no cache hit', { key });
      const result = await handler.oracle.getTransactionInformation(reference as string, poolAddress as string, symbol);
      txInfoCache.set(key, result);
      return result;
    }
  } catch (error) {
    logger.error('Error getTransactionInfoResult', { error });
    return null;
  } finally {
    release();
  }
}

app.get('/:symbol/oracle/transactionInfo', async (req, res) => {
  const handler = getHandlerForSymbol(req.params.symbol);
  if (handler === null) return res.status(400).json({ status: 'UNSUPPORTED_SYMBOL' });
  const { reference, poolAddress } = req.query;
  logger.info('Called /oracle/transactionInfo', { reference, poolAddress });
  if (!reference || !poolAddress) return res.status(400).json({ status: 'MISSING_PARAMS' });
  const result = await getTransactionInfoResult(
    handler,
    req.params.symbol!,
    reference as string,
    poolAddress as string,
  );
  if (result === null) {
    res.status(500);
  }
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
  const result = await handler.oracle.validateSignature(message as string, address, signature as string);
  return res.json(result);
});

const createTxMx = new Mutex();
const createTxCache = new NodeCache({ stdTTL: 10, checkperiod: 1 });

async function createTransaction(
  handler: FullServiceHandlers,
  transactionData: AssetTransactionData[],
  symbol?: string,
): Promise<CreateTransactionResponse | null> {
  const release = await createTxMx.acquire();
  try {
    const key = JSON.stringify(transactionData);
    const fromCache: CreateTransactionResponse | undefined = createTxCache.get(key);
    if (fromCache) {
      logger.info('Create tx delivering from cache', { key });
      return fromCache;
    } else {
      logger.info('Create tx no cache hit', { key });
      const result = await handler.transactionService.createTransaction(
        transactionData as AssetTransactionData[],
        symbol,
      );
      createTxCache.set(key, result);
      return result;
    }
  } catch (error) {
    return null;
  } finally {
    release();
  }
}

app.post('/:symbol/tx/create', async (req, res) => {
  const handler = getHandlerForSymbol(req.params.symbol);
  if (handler === null) return res.status(400).json({ status: 'UNSUPPORTED_SYMBOL' });
  const { transactionData } = req.body;
  logger.info('Called /tx/create');
  if (!transactionData) {
    return res.status(400).json({ status: 'MISSING_BODY' });
  }
  const result = await createTransaction(handler, transactionData as AssetTransactionData[], req.params.symbol);
  if (result === null) {
    return res.status(500).json({ status: 'ERROR' });
  }
  switch (result.status) {
    case 'OK':
      return res.json(result);
    case 'INSUFFICIENT_FUNDS':
      return res.status(400).json({ status: result.status });
    case 'INVALID_RECEIVER_ADDRESS':
      return res.status(400).json({ status: result.status });
    case 'INVALID_SENDER_ADDRESS':
      return res.status(400).json({ status: result.status });
    default:
      return res.status(500).json({ status: result.status });
  }
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
  if (result.status === 'ERROR') {
    return res.status(500).json(result);
  }
  if (result.status === 'INVALID_SIGNATURES') {
    return res.status(400).json(result);
  }
  return res.json(result);
});

const port = process.env.PORT || 4000;
app.listen(port);
logger.info(`Service listening on port ${port}`);
