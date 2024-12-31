import { CompositeClient, Network } from "@dydxprotocol/v4-client-js";

const testnetNetwork = Network.testnet();
export const globalTestnetClient = await CompositeClient.connect(
  testnetNetwork
);

const mainnetNetwork = Network.mainnet();
export const globalMainnetClient = await CompositeClient.connect(
  mainnetNetwork
);
