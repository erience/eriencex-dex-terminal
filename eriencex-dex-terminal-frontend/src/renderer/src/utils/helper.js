import { toast } from 'react-toastify'

export const calculateSecond = (number, timeframe) => {
  let seconds = 0
  switch (timeframe.toLowerCase()) {
    case 'day':
      seconds = number * 24 * 60 * 60
      break
    case 'hour':
      seconds = number * 60 * 60
      break
    case 'minute':
      seconds = number * 60
      break
    case 'second':
      seconds = number
      break
    case 'week':
      seconds = number * 7 * 24 * 60 * 60
      break
    default:
      console.error("Invalid timeframe. Please use 'day', 'hour', 'minute', or 'second'.")
  }

  return seconds
}

export function calculateBuyingPower(freeCollateral, initialMarginFraction) {
  if ((freeCollateral, initialMarginFraction)) {
    const collateral = parseFloat(freeCollateral)
    const marginFraction = parseFloat(initialMarginFraction)
    const buyingPower = collateral / marginFraction

    return Math.round(buyingPower)
  }
}

export const formatWithCommas = (number, tickSize) => {
  const parsedNumber = parseFloat(number)
  if (tickSize) {
    return parsedNumber.toLocaleString('en-US', {
      minimumFractionDigits: tickSize,
      maximumFractionDigits: tickSize
    })
  } else {
    return Math.floor(parsedNumber).toLocaleString('en-US')
  }
}

export const formatPairName = (pairName) => {
  if (pairName.length > 8 && pairName.includes(',')) {
    const splitName = pairName.split(',')
    return `${splitName[0]}-USD`
  }
  return pairName
}

export const showToast = (message, type = 'success', customStyle = {}) => {
  const defaultStyle = {
    success: { backgroundColor: '#11e7b0', color: 'black' },
    error: { backgroundColor: '#eb4034', color: 'white' },
    info: { backgroundColor: '#2196f3', color: 'white' },
    warning: { backgroundColor: '#ff9800', color: 'black' }
  }

  const style = customStyle ? { ...defaultStyle[type], ...customStyle } : defaultStyle[type]

  toast[type](message, {
    style: style
  })
}
