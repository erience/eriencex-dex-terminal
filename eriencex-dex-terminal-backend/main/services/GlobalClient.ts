import {
  CompositeClient,
  IndexerClient,
  Network,
} from "@dydxprotocol/v4-client-js";

const testnetNetwork = Network.testnet();
export const globalTestnetCompClient = await CompositeClient.connect(
  testnetNetwork
);
export const globalTestnetIndexerClient = new IndexerClient(
  testnetNetwork.indexerConfig
);

const mainnetNetwork = Network.mainnet();
export const globalMainnetCompClient = await CompositeClient.connect(
  mainnetNetwork
);
export const globalMainnetIndexerClient = new IndexerClient(
  mainnetNetwork.indexerConfig
);
