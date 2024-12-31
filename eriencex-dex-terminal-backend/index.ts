import dotenv from "dotenv";
dotenv.config();
import cors from "cors";

import express, { Request, Response } from "express";
import router from "./main/router/router";
import ensureAllTable from "./main/util/createAllTable";
ensureAllTable();
const app = express();
app.use(cors());

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  // @ts-ignore
  res.status(200).send("Hello, world!");
});

app.use("/api/v1", router);

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
