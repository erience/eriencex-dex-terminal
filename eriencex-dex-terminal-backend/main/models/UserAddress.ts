import connection from "../config/Database";

interface userAddressInsertValues {
  userAddress: string;
  isReferred: number;
}

export const createTableUserAddress = (
  callback: (err: any, result: any) => void
) => {
  const query = `CREATE TABLE IF NOT EXISTS userAddress (
        id INT AUTO_INCREMENT,
        userAddress VARCHAR(45) UNIQUE,
        isReferred TINYINT(1),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_userAddress (userAddress)
    );`;
  // isReferred:  1=referred,2=not reffered

  connection.query(query, callback);
};

export const insertIntoUserAddressTable = (
  values: userAddressInsertValues,
  callback: (err: any, result: any) => void
) => {
  const query = `INSERT INTO userAddress (userAddress, isReferred) VALUES (?, ?)`;
  const insertValues = [values.userAddress, values.isReferred];

  connection.query(query, insertValues, callback);
};

export const getDataByUserAddress = (
  userAddress: string,
  callback: (err: any, result: any) => void
) => {
  const query = `SELECT userAddress,isReferred FROM userAddress WHERE userAddress = ?`;
  connection.query(query, [userAddress], callback);
};
