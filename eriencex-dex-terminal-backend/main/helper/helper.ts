import axios from "axios";
import crypto from "crypto";

// const netWorkType: any = "TESTNET"; // MAINNET TESTNET

export const getAssetPrice = async (netWorkType: any, pair: string) => {
  const maxRetries = 200;
  let retries = 0;
  let delay = 1000;
  while (retries < maxRetries) {
    try {
      // Mainnet
      // https://indexer.dydx.trade/v4

      // TestNet
      // https://dydx-testnet.imperator.co/v4

      // TestNet
      let response: any;

      if (netWorkType == "TESTNET") {
        response = await axios.get(
          `https://dydx-testnet.imperator.co/v4/candles/perpetualMarkets/${pair}?resolution=1MIN&limit=1`
        );
      } else if (netWorkType == "MAINNET") {
        response = await axios.get(
          `https://indexer.dydx.trade/v4/candles/perpetualMarkets/${pair}?resolution=1MIN&limit=1`
        );
      }

      const data = response.data;

      const price = data?.candles[0]?.close;

      return { status: true, price: parseFloat(price) ?? 0 };
    } catch (error) {
      if (error.response && error.response.status === 429) {
        await delayRetry(delay);
        delay *= 2;
        retries++;
      } else {
        console.log(`Error fetching asset price:`, error);
        return { status: false, price: 0 };
      }
    }
  }
  return { status: false, price: 0 };
};

export const getMarketInfo = async (netWorkType: any, pair: string) => {
  const maxRetries = 200;
  let retries = 0;
  let delay = 1000;
  while (retries < maxRetries) {
    try {
      // Mainnet
      // https://indexer.dydx.trade/v4

      // TestNet
      // https://dydx-testnet.imperator.co/v4

      // TestNet
      let response: any;

      if (netWorkType == "TESTNET") {
        response = await axios.get(
          `https://dydx-testnet.imperator.co/v4/perpetualMarkets?ticker=${pair}`
        );
      } else if (netWorkType == "MAINNET") {
        response = await axios.get(
          `https://indexer.dydx.trade/v4/perpetualMarkets?ticker=${pair}`
        );
      }

      const data = response.data;

      const marketData = data?.markets?.[`${pair}`];
      return { status: true, marketData };
    } catch (error) {
      if (error.response && error.response.status === 429) {
        await delayRetry(delay);
        delay *= 2;
        retries++;
      } else {
        console.log(`Error fetching asset price:`, error);
        return { status: false, marketData: null };
      }
    }
  }
  return { status: false, marketData: null };
};

const delayRetry = (delay: number) =>
  new Promise((resolve) => setTimeout(resolve, delay));

export const generateCustomOrderid = (length: number, message: any) => {
  const charset = "0123456789";
  let randomNumberString = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    randomNumberString += charset[randomIndex];
  }

  const str = `4552${randomNumberString}`;
  return Number(str);
};

export const calculateSecond = (number: any, timeframe: any) => {
  let seconds = 0;

  switch (timeframe.toLowerCase()) {
    case "day":
      seconds = number * 24 * 60 * 60;
      break;
    case "hour":
      seconds = number * 60 * 60;
      break;
    case "minute":
      seconds = number * 60;
      break;
    case "second":
      seconds = number;
      break;
    case "week":
      seconds = number * 7 * 24 * 60 * 60;
      break;
    default:
      console.error(
        "Invalid timeframe. Please use 'day', 'hour', 'minute', or 'second'."
      );
  }

  return seconds;
};

export async function decryptRSA(privateKey: any, encryptedMessage: any) {
  const decrypted = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    Buffer.from(encryptedMessage, "base64") // Convert base64 string back to buffer
  );
  return decrypted.toString();
}
