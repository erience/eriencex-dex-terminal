import { decryptRSA } from "../helper/helper";
import {
  globalMainnetCompClient,
  globalTestnetCompClient,
} from "./GlobalClient";

type DydxV4Client = {
  BECH32_PREFIX: string;
  LocalWallet: {
    fromMnemonic: (mnemonic: string, prefix: string) => Promise<any>;
  };
};

type WalletEntry = {
  wallet: any;
  network: "MAINNET" | "TESTNET";
  cachedAt: number;
};

const CACHE_TTL_MS = 60 * 60 * 1000;
const walletCache = new Map<string, WalletEntry>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of walletCache) {
    if (now - entry.cachedAt > CACHE_TTL_MS) {
      walletCache.delete(key);
    }
  }
}, 10 * 60 * 1000);

export async function getOrCreateWallet(
  encryptedMnemonic: string,
  network: "MAINNET" | "TESTNET"
) {
  const mnemonic = await decryptRSA(process.env.SECRET_KEY, encryptedMnemonic);
  const cacheKey = `${network}:${mnemonic}`;

  const cached = walletCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.wallet;
  }

  const { BECH32_PREFIX, LocalWallet } = (await import(
    "@dydxprotocol/v4-client-js"
  )) as DydxV4Client;

  const wallet = await LocalWallet.fromMnemonic(mnemonic, BECH32_PREFIX);
  const client =
    network === "MAINNET" ? globalMainnetCompClient : globalTestnetCompClient;
  // @ts-ignore
  await client.populateAccountNumberCache(wallet.address);

  walletCache.set(cacheKey, { wallet, network, cachedAt: Date.now() });
  return wallet;
}
