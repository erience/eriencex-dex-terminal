import { createTableUserAddress } from "../models/UserAddress";

const ensureAllTable = async () => {
  try {
    createTableUserAddress((err: Error, result: any) => {
      if (err) {
        console.log(err);
      } else {
        console.log("userAddress Table Ensure");
      }
    });
  } catch (error) {
    console.log("Error while ensuring all tables", error);
  }
};

export default ensureAllTable;
