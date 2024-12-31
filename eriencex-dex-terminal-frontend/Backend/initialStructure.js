const dbStructure = {
  Limitorders: [],
  orders: [],
  allGridSettings: [],
  profileSettings: [
    {
      memonic: '',
      userEquity: 0,
      testnet: false
    }
  ]
}

const idStructure = {
  ids: []
}
const errorStructure = {
  errors: []
}
const historyStructure = {
  history: []
}

export const intialStructure = {
  db: JSON.stringify(dbStructure, null, 2),
  id: JSON.stringify(idStructure, null, 2),
  errors: JSON.stringify(errorStructure, null, 2),
  history: JSON.stringify(historyStructure, null, 2)
}
