import Joi from "joi";
import {
  Network,
  OrderExecution,
  OrderSide,
  OrderTimeInForce,
  OrderType,
  SubaccountClient,
  IndexerClient,
  ValidatorClient,
  BECH32_PREFIX,
} from "@dydxprotocol/v4-client-js";
import dotenv from "dotenv";

dotenv.config();
import {
  calculateSecond,
  generateCustomOrderid,
  getActiveOrder,
  getAssetPrice,
} from "../helper/helper";
import {
  getDataByUserAddress,
  insertIntoUserAddressTable,
} from "../models/UserAddress";
import { getOrCreateWallet } from "../services/WalletCache";
import {
  globalMainnetCompClient,
  globalMainnetIndexerClient,
  globalTestnetCompClient,
  globalTestnetIndexerClient,
} from "../services/GlobalClient";
interface UserAddressResult {
  userAddress: string;
  isReferred: number;
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const getWalletAddressfromMemonic = async (req: any, res: any) => {
  const schema = Joi.object({
    memonic: Joi.string().required(),
    network: Joi.string().valid("MAINNET", "TESTNET").required(),
  });

  try {
    const { error, value } = schema.validate(req.body);

    if (error) {
      throw new Error(error.message);
    }

    const wallet = await getOrCreateWallet(value.memonic, value.network);
    const userAddress = wallet.address;
    if (userAddress) {
      const userAddressData = await new Promise<UserAddressResult | null>(
        (resolve, reject) => {
          getDataByUserAddress(
            userAddress,
            (err: Error | null, result: UserAddressResult[]) => {
              if (err) {
                console.log(err);
                reject(err);
              } else {
                resolve(result[0] || null);
              }
            }
          );
        }
      );
      if (userAddressData) {
        if (userAddressData.isReferred != 1) {
          registerAffilate(wallet);
        }
      } else {
        registerAffilate(wallet);
      }
    }

    return res.status(200).json({
      status: true,
      message: `Wallet Founded Successfully`,
      wallet: wallet.address,
    });
  } catch (error) {
    console.log("Error while getWalletAddressFromMemonic", error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

// To Place ShortTerm Order
export const executeCopyLimitorder = async (req: any, res: any) => {
  const schema = Joi.object({
    pair: Joi.string().required(),
    size: Joi.number().required(),
    side: Joi.string().allow("buy", "sell").required(),
    triggerPrice: Joi.number().required(),
    price: Joi.number().required(),
    memonic: Joi.string().required(),
    oType: Joi.string()
      .allow(
        "LIMIT",
        "STOP_LIMIT",
        "TAKE_PROFIT_LIMIT",
        "STOP_MARKET",
        "TAKE_PROFIT_MARKET"
      )
      .required(),
    ordertype: Joi.string().allow("IOC", "FOK", "GTT").required(),
    time: Joi.number().optional(),
    timeFrame: Joi.string().allow("day", "hour", "minute", "week").optional(),
    reduceOnly: Joi.boolean().required(),
    postOnly: Joi.boolean().required(),
    currentHeight: Joi.number().required(),
    blockHeight: Joi.number().required(),
    goodTilBlock: Joi.number().required(),
    network: Joi.string().valid("MAINNET", "TESTNET").required(),
  });

  try {
    const { error, value } = schema.validate(req.body);

    if (error) {
      throw new Error(error.message);
    }

    const client =
      value.network === "MAINNET"
        ? globalMainnetCompClient
        : globalTestnetCompClient;
    const wallet = await getOrCreateWallet(value.memonic, value.network);
    // @ts-ignore
    const subaccount = new SubaccountClient(wallet, 0);

    const clientId = generateCustomOrderid(10, "Limit order  exe"); // set to a number, can be used by the client to identify the order
    const market = value.pair; // perpetual market id
    let type: any; // order type
    let price = value.price;
    if (value.oType == "LIMIT") {
      type = OrderType.LIMIT;
    } else if (value.oType == "STOP_LIMIT") {
      type = OrderType.STOP_LIMIT;
      price = value.price;
    } else if (value.oType == "TAKE_PROFIT_LIMIT") {
      type = OrderType.TAKE_PROFIT_LIMIT;
      price = value.price;
    } else if (value.oType == "STOP_MARKET") {
      type = OrderType.STOP_MARKET;
      price = value.price;
    } else if (value.oType == "TAKE_PROFIT_MARKET") {
      type = OrderType.TAKE_PROFIT_MARKET;
      price = value.price;
    }

    let side: any;

    let reduceOnly: any;

    if (value.side == "buy") {
      side = OrderSide.BUY;
      reduceOnly = false;
    } else if (value.side == "sell") {
      side = OrderSide.SELL;
      reduceOnly = false;
    } else {
      throw new Error(`Side is Not Valid`);
    }

    let timeInForce;
    let time = 0;

    if (value.ordertype == "IOC") {
      timeInForce = OrderTimeInForce.IOC; // UX TimeInForce
    } else if (value.ordertype == "FOK") {
      timeInForce = OrderTimeInForce.FOK; // UX TimeInForce
    } else if (value.ordertype == "GTT") {
      timeInForce = OrderTimeInForce.GTT; // UX TimeInForce
      if (
        value.timeFrame == "day" ||
        value.timeFrame == "hour" ||
        value.timeFrame == "minute"
      ) {
        time = calculateSecond(value.time, value.timeFrame);
      } else {
        throw new Error(`Time Frame is Not Valid`);
      }
    }
    timeInForce = OrderTimeInForce.IOC;

    const execution = OrderExecution.FOK;

    const size = value.size; // subticks are calculated by the price of the order
    const postOnly = false; // If true, order is post only
    const triggerPrice = value.triggerPrice; // required for conditional orders
    const sendCurrentHeight = value.currentHeight;
    const marketInfo = null;
    const currentHeight = null;
    let difference = value.goodTilBlock - value.blockHeight;

    if (difference > 20) {
      difference = 15;
    } else {
      difference;
    }

    const goodTilBlock = sendCurrentHeight + difference;

    try {
      const tx = await client.placeOrder(
        subaccount,
        market,
        type,
        side,
        price,
        size,
        clientId,
        timeInForce,
        time,
        execution,
        postOnly,
        value.reduceOnly,
        triggerPrice,
        // @ts-ignore
        marketInfo,
        currentHeight,
        goodTilBlock,
        "dYdX x Erience DEX Terminal"
      );
      // @ts-ignore
      const hash = Uint8Array.from(tx?.hash);
      const hashString = Array.from(hash, (byte) => {
        return ("0" + (byte & 0xff).toString(16)).slice(-2);
      }).join("");

      return res.status(200).json({
        status: true,
        message: `Limit Order Placed successfully`,
        tx: hashString,
        clientId,
      });
    } catch (error) {
      return res.status(400).json({ status: false, message: error.message });
    }
  } catch (error) {
    return res.status(400).json({ status: false, message: error.message });
  }
};

// To Place StatefulOrder Order
export const executeLimitorder = async (req: any, res: any) => {
  const schema = Joi.object({
    pair: Joi.string().required(),
    size: Joi.number().required(),
    side: Joi.string().allow("buy", "sell").required(),
    triggerPrice: Joi.number().required(),
    price: Joi.number().required(),
    memonic: Joi.string().required(),
    oType: Joi.string()
      .allow(
        "LIMIT",
        "STOP_LIMIT",
        "TAKE_PROFIT_LIMIT",
        "STOP_MARKET",
        "TAKE_PROFIT_MARKET"
      )
      .required(),
    ordertype: Joi.string().allow("IOC", "FOK", "GTT").required(),
    time: Joi.number().optional(),
    timeFrame: Joi.string().allow("day", "hour", "minute", "week").optional(),
    reduceOnly: Joi.boolean().required(),
    postOnly: Joi.boolean().required(),
    orderid: Joi.string().required(),
    network: Joi.string().valid("MAINNET", "TESTNET").required(),
  });
  try {
    const { error, value } = schema.validate(req.body);

    if (error) {
      throw new Error(error.message);
    }

    const client =
      value.network === "MAINNET"
        ? globalMainnetCompClient
        : globalTestnetCompClient;
    const currentPrice = await getAssetPrice(value.network, value.pair);

    if (currentPrice.status == false) {
      throw new Error(`Asset Price not found`);
    }

    const wallet = await getOrCreateWallet(value.memonic, value.network);

    // @ts-ignore
    const subaccount = new SubaccountClient(wallet, 0);
    const clientId = value.orderid;
    const market = value.pair;
    let type: any;

    let price = value.price;

    if (value.oType == "LIMIT") {
      type = OrderType.LIMIT;
    } else if (value.oType == "STOP_LIMIT") {
      type = OrderType.STOP_LIMIT;
      price = value.price;
    } else if (value.oType == "TAKE_PROFIT_LIMIT") {
      type = OrderType.TAKE_PROFIT_LIMIT;
      price = value.price;
    } else if (value.oType == "STOP_MARKET") {
      type = OrderType.STOP_MARKET;
      price = value.price;
    } else if (value.oType == "TAKE_PROFIT_MARKET") {
      type = OrderType.TAKE_PROFIT_MARKET;
      price = value.price;
    }

    let side: any;

    let reduceOnly: any;

    if (value.side == "buy") {
      side = OrderSide.BUY;
      reduceOnly = false;
    } else if (value.side == "sell") {
      side = OrderSide.SELL;
      reduceOnly = false;
    } else {
      throw new Error(`Side is Not Valid`);
    }

    let timeInForce: any;
    let time = 0;

    if (value.ordertype == "IOC") {
      timeInForce = OrderTimeInForce.IOC; // UX TimeInForce
    } else if (value.ordertype == "FOK") {
      timeInForce = OrderTimeInForce.FOK; // UX TimeInForce
    } else if (value.ordertype == "GTT") {
      timeInForce = OrderTimeInForce.GTT; // UX TimeInForce
      if (
        value.timeFrame == "day" ||
        value.timeFrame == "hour" ||
        value.timeFrame == "minute"
      ) {
        time = calculateSecond(value.time, value.timeFrame);
      } else {
        throw new Error(`Time Frame is Not Valid`);
      }
    }

    const execution = OrderExecution.DEFAULT;

    const size = value.size;
    const postOnly = false;
    const triggerPrice = value.triggerPrice;
    let marketInfo = null;

    let responseSent = false;

    const placeOrderWithRetry = async (retryCount = 0) => {
      try {
        const tx = await client.placeOrder(
          subaccount,
          market,
          type,
          side,
          price,
          size,
          clientId,
          timeInForce,
          time,
          execution,
          postOnly,
          value.reduceOnly,
          triggerPrice,
          // @ts-ignore
          undefined, // marketInfo
          undefined, // currentHeight
          undefined, // goodTilBlock
          "dYdX x Erience DEX Terminal"
        );
        // @ts-ignore
        const hash = Uint8Array.from(tx?.hash);
        const hashString = Array.from(hash, (byte) =>
          ("0" + (byte & 0xff).toString(16)).slice(-2)
        ).join("");

        if (!responseSent) {
          responseSent = true;
          return res.status(200).json({
            status: true,
            message: `Limit Order Placed successfully`,
            tx: hashString,
            clientId,
          });
        }
      } catch (err) {
        if (err.message.includes("sequence mismatch") && retryCount < 3) {
          console.log(
            `Sequence mismatch detected.while executeLimitOrder Retrying... Attempt #${
              retryCount + 1
            }`
          );
          await delay(5000);
          return placeOrderWithRetry(retryCount + 1);
        } else {
          console.log("Error during order execution", err);
        }

        if (!responseSent) {
          responseSent = true;
          return res.status(400).json({ status: false, message: err.message });
        }
      }
    };

    await placeOrderWithRetry();
  } catch (error) {
    console.log("Error while executeLimitOrder", error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

// To place market order
export const executeOrder = async (req: any, res: any) => {
  const schema = Joi.object({
    pair: Joi.string().required(),
    size: Joi.number().required(),
    side: Joi.string().allow("buy", "sell").required(),
    memonic: Joi.string().required(),
    reduceOnly: Joi.boolean().required(),
    network: Joi.string().valid("MAINNET", "TESTNET").required(),
  });

  try {
    const { error, value } = schema.validate(req.body);

    if (error) {
      throw new Error(error.message);
    }

    let NETWORK: any;
    if (value.network == "TESTNET") {
      NETWORK = Network.testnet();
    } else if (value.network == "MAINNET") {
      NETWORK = Network.mainnet();
    }
    const client =
      value.network === "MAINNET"
        ? globalMainnetCompClient
        : globalTestnetCompClient;
    const indexerClient = new IndexerClient(NETWORK.indexerConfig);
    const currentHeight = await indexerClient._utility.getHeight();
    let marketInfo = null;

    const wallet = await getOrCreateWallet(value.memonic, value.network);

    // @ts-ignore
    const subaccount = new SubaccountClient(wallet, 0);
    const clientId = generateCustomOrderid(10, "order exe");

    const market = value.pair;
    const type = OrderType.LIMIT;

    let side: any;
    if (value.side == "buy") {
      side = OrderSide.BUY;
    } else if (value.side == "sell") {
      side = OrderSide.SELL;
    }

    let timeInForce = OrderTimeInForce.GTT;

    const execution = OrderExecution.DEFAULT;
    const currentPrice = await getAssetPrice(value.network, value.pair);
    if (currentPrice.status == false) {
      throw new Error(`Asset Price not found`);
    }
    let price = 0;
    if (value.side == "buy") {
      price = currentPrice.price + currentPrice.price * 0.01;
    } else if (value.side == "sell") {
      price = currentPrice.price - currentPrice.price * 0.01;
    }
    const time = calculateSecond(1, "week");
    const size = value.size;
    const postOnly = false;
    const reduceOnly = false;
    const triggerPrice = undefined;

    let responseSent = false;

    const placeOrderWithRetry = async (retryCount = 0) => {
      try {
        const tx = await client.placeOrder(
          subaccount,
          market,
          type,
          side,
          price,
          size,
          clientId,
          timeInForce,
          time,
          execution,
          postOnly,
          reduceOnly,
          triggerPrice,
          // @ts-ignore
          marketInfo,
          undefined,
          undefined,
          "dYdX x Erience DEX Terminal"
        );
        // @ts-ignore
        const hash = Uint8Array.from(tx?.hash);
        const hashString = Array.from(hash, (byte) =>
          ("0" + (byte & 0xff).toString(16)).slice(-2)
        ).join("");

        if (!responseSent) {
          responseSent = true;
          return res.status(200).json({
            status: true,
            message: `Limit Order Placed successfully`,
            tx: hashString,
            clientId,
          });
        }
      } catch (err) {
        if (err.message.includes("sequence mismatch") && retryCount < 3) {
          console.log(
            `Sequence mismatch detected.while executeLimitOrder Retrying... Attempt #${
              retryCount + 1
            }`
          );
          await delay(5000);
          return placeOrderWithRetry(retryCount + 1);
        } else {
          console.log("Error during order execution", err);
        }

        if (!responseSent) {
          responseSent = true;
          return res.status(400).json({ status: false, message: err.message });
        }
      }
    };

    await placeOrderWithRetry();
  } catch (error) {
    console.log("Error while executeOrder", error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

// to cancel order
export const cancelOrder = async (req: any, res: any) => {
  const schema = Joi.object({
    clientId: Joi.string().required(),
    orderFlags: Joi.string().required(),
    clobPairId: Joi.string().required(),
    goodTilBlock: Joi.number().required(),
    goodTilBlockTime: Joi.required(),
    // goodTilBlockTime: Joi.number().required(),
    memonic: Joi.string().required(),
    network: Joi.string().valid("MAINNET", "TESTNET").required(),
  });

  try {
    const { error, value } = schema.validate(req.body);

    if (error) {
      throw new Error(error.message);
    }

    const client =
      value.network === "MAINNET"
        ? globalMainnetCompClient
        : globalTestnetCompClient;
    const wallet = await getOrCreateWallet(value.memonic, value.network);

    // @ts-ignore
    let goodTilBlock: any;

    try {
      if (Number(value.orderFlags) == 0) {
        const currentBlock =
          await client.validatorClient.get.latestBlockHeight();
        const nextValidBlockHeight = currentBlock + 1;
        goodTilBlock = nextValidBlockHeight + 10;
      } else {
        goodTilBlock = value.goodTilBlock;
      }

      const subaccount = new SubaccountClient(wallet, 0);
      const currentTime = Date.now();

      let responseSent = false;

      const cancleOrderWithRetry = async (retryCount = 0) => {
        try {
          const tx = await client.cancelOrder(
            subaccount,
            value.clientId,
            Number(value.orderFlags),
            value.clobPairId,
            // goodTilBlock
            0,
            Math.round(new Date(value.goodTilBlockTime).getTime() / 1000) -
              currentTime / 1000
          );
          // @ts-ignore
          const hash = Uint8Array.from(tx?.hash);
          const hashString = Array.from(hash, (byte) =>
            ("0" + (byte & 0xff).toString(16)).slice(-2)
          ).join("");

          if (!responseSent) {
            responseSent = true;
            return res.status(200).json({
              status: true,
              message: `Order Cancelled successfully`,
              tx: hashString,
            });
          }
        } catch (err) {
          if (err.message.includes("sequence mismatch") && retryCount < 10) {
            console.log(
              `Sequence mismatch detected. while cancelling Retrying... Attempt #${
                retryCount + 1
              }`
            );
            await delay(5000);
            return cancleOrderWithRetry(retryCount + 1);
          } else {
            console.log("Error during order cancelletion", err);
          }

          if (!responseSent) {
            responseSent = true;
            return res
              .status(400)
              .json({ status: false, message: err.message });
          }
        }
      };

      await cancleOrderWithRetry();
    } catch (error) {
      console.log("Error while cancel order", error);
      return res.status(400).json({ status: false, message: error.message });
    }
  } catch (error) {
    console.log("Error while cancel order", error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

// To cancel GridBot Order In Batch
export const cancelOrderInbatch = async (req: any, res: any) => {
  const schema = Joi.object({
    orderIds: Joi.array().required(),
    memonic: Joi.string().required(),
    network: Joi.string().valid("MAINNET", "TESTNET").required(),
  });
  try {
    const { error, value } = schema.validate(req.body);

    if (error) {
      throw new Error(error.message);
    }
    const client =
      value.network === "MAINNET"
        ? globalMainnetCompClient
        : globalTestnetCompClient;
    const wallet = await getOrCreateWallet(value.memonic, value.network);
    const subaccount = new SubaccountClient(wallet, 0);

    const orders = await getActiveOrder(
      value.network,
      subaccount.address,
      subaccount.subaccountNumber
    );
    if (
      value.orderIds.length > 0 &&
      orders.status &&
      orders.orders.length > 0
    ) {
      const ActiveOrders = orders.orders;
      for (const orderId of value.orderIds) {
        const orderToCancel = ActiveOrders.find(
          (order: any) => Number(order.clientId) === orderId
        );
        if (orderToCancel) {
          // @ts-ignore
          let goodTilBlock: any;
          try {
            if (Number(orderToCancel.orderFlags) == 0) {
              const currentBlock =
                await client.validatorClient.get.latestBlockHeight();
              const nextValidBlockHeight = currentBlock + 1;
              goodTilBlock = nextValidBlockHeight + 10;
            } else {
              goodTilBlock = orderToCancel.goodTilBlock;
            }
            const currentTime = Date.now();

            const cancleOrderWithRetry = async (retryCount = 0) => {
              try {
                const tx = await client.cancelOrder(
                  subaccount,
                  orderToCancel.clientId,
                  Number(orderToCancel.orderFlags),
                  orderToCancel.ticker,
                  // goodTilBlock
                  0,
                  Math.round(
                    new Date(orderToCancel.goodTilBlockTime).getTime() / 1000
                  ) -
                    currentTime / 1000
                );
                // @ts-ignore
                const hash = Uint8Array.from(tx?.hash);
                const hashString = Array.from(hash, (byte) =>
                  ("0" + (byte & 0xff).toString(16)).slice(-2)
                ).join("");
              } catch (err) {
                if (
                  err.message.includes("sequence mismatch") &&
                  retryCount < 10
                ) {
                  console.log(
                    `Sequence mismatch detected. while cancelling Retrying... Attempt #${
                      retryCount + 1
                    }`
                  );
                  await delay(5000);
                  return cancleOrderWithRetry(retryCount + 1);
                } else {
                  console.log("Error during order cancelletion", err);
                }
              }
            };

            await cancleOrderWithRetry();
          } catch (error) {
            console.log("Error while cancel order", error);
          }
        }
      }
    }
    return res
      .status(200)
      .json({ status: true, message: "All Orders Cancelled" });
  } catch (error) {
    console.log("Error while cancel order", error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const registerAffilate = async (wallet: any) => {
  try {
    const userAddress = wallet.address;
    if (!userAddress) {
      throw new Error("Wallet address is undefined");
    }
    const NETWORK = Network.mainnet();
    const validatorClient = await ValidatorClient.connect(
      NETWORK.validatorConfig
    );
    const subaccount = new SubaccountClient(wallet, 0);
    const tx = await validatorClient.post.registerAffiliate(
      subaccount,
      // @ts-ignore
      process.env.AFFILATE_USERADDRESS
    );
    const insertData = await new Promise<any>((resolve, reject) => {
      insertIntoUserAddressTable(
        { userAddress, isReferred: 1 },
        (err: Error | null, result: any) => {
          if (err) {
            console.log(err);
            reject(err);
          } else {
            resolve(result);
          }
        }
      );
    });
  } catch (error) {
    console.log(
      `Error while register affilate for userAddress ${wallet.address}`,
      error.message
    );
  }
};
