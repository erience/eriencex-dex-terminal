import express from "express";
import {
  cancelOrder,
  executeCopyLimitorder,
  executeLimitorder,
  executeOrder,
  getWalletAddressfromMemonic,
} from "../controller/orders";

const router = express
  .Router()
  .get("/", (req, res) => {
    return res.status(200).json({ status: true, message: "ok" });
  })
  .post("/limitorder", executeLimitorder)
  .post("/executeCopyLimitorder", executeCopyLimitorder)
  .post("/order", executeOrder)
  .post("/cancelOrder", cancelOrder)
  .post("/getWalletfrommemonic", getWalletAddressfromMemonic);

export default router;
