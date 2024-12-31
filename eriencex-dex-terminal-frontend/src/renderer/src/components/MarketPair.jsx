import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { FaArrowCircleDown, FaStar } from 'react-icons/fa'
import { FaMagnifyingGlass } from 'react-icons/fa6'
import loadingGif from '../assets/loading.gif'
import { formatPairName, formatWithCommas } from '../utils/helper'
import { useSelector } from 'react-redux'
import { selectData } from '../redux-toolkit/dataSlice'

const MarketPair = () => {
  const { cryptoPair } = useSelector(selectData)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState([])
  const [isFav, setIsFav] = useState(false)
  const [isSorting, setIsSorting] = useState(false)

  const filteredPairs = useMemo(() => {
    return cryptoPair
      .filter((pair) => pair?.ticker.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        const perA = ((a?.priceChange24H * 100) / a?.oraclePrice).toFixed(2)
        const perB = ((b?.priceChange24H * 100) / b?.oraclePrice).toFixed(2)
        return isSorting ? perB - perA : 0
      })
  }, [cryptoPair, search, isSorting])

  const toggleFavorite = useCallback((pair) => {
    setFavorites((prev) =>
      prev.some((fav) => fav?.ticker === pair?.ticker)
        ? prev.filter((fav) => fav?.ticker !== pair?.ticker)
        : [...prev, pair]
    )
  }, [])

  const renderPairs = useCallback(
    (pairs) =>
      pairs.length > 0 ? (
        pairs.map((pair, i) => {
          const per = parseFloat((pair?.priceChange24H * 100) / pair?.oraclePrice).toFixed(2)
          const success = per > 0
          const decimalPlaces = Math.max(0, Math.round(-Math.log10(pair?.tickSize || 1)))
          const price = parseFloat(pair?.oraclePrice)
          const isFavorite = favorites.some((fav) => fav?.ticker === pair?.ticker)
          return (
            <tr key={i} className="break-all">
              <td className="text-xs font-light w-1/3">
                <div
                  className="flex items-center gap-x-2 cursor-pointer"
                  onClick={() => toggleFavorite(pair)}
                >
                  <FaStar
                    className={`cursor-pointer ${isFavorite ? 'primary-color' : 'text-gray-400'}`}
                  />
                  <span className="text-gray-400">{formatPairName(pair?.ticker)}</span>
                </div>
              </td>
              <td className="text-xs text-right font-light text-gray-400 w-1/3">
                <span>{formatWithCommas(price, decimalPlaces)}</span>
              </td>
              <td
                className={`text-xs text-right font-light ${success ? 'primary-color' : 'secondary-color'} w-1/3`}
              >
                <span className="relative">
                  {' '}
                  {!success && <span className="absolute -left-[6px]">-</span>}
                  {formatWithCommas(Math.abs(per), 2)}%
                </span>
              </td>
            </tr>
          )
        })
      ) : (
        <tr>
          <td colSpan={3} className="h-[370px] p-0">
            <div className="h-full flex items-center justify-center text-center text-gray-500">
              {search ? 'No result found' : 'No pairs available'}
            </div>
          </td>
        </tr>
      ),
    [favorites, toggleFavorite, search]
  )

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 1000)
    return () => clearTimeout(timeout)
  }, [])

  return (
    <div className="relative py-3 border-b border-gray-700">
      <div className="relative w-full h-8 rounded-md flex items-center overflow-hidden bg-semi-dark text-gray-400 mb-5">
        <span className="flex items-center justify-center w-8 h-8">
          <FaMagnifyingGlass />
        </span>
        <input
          type="text"
          name="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search"
          className="w-full h-full p-2 border-0 outline-none bg-transparent font-light"
        />
      </div>
      <div className="flex items-center gap-x-2 whitespace-nowrap mb-4">
        <button
          type="button"
          className={`flex items-center gap-1 ${isFav ? 'primary-color' : 'text-gray-400'} text-sm font-light`}
          onClick={() => setIsFav(!isFav)}
        >
          <FaStar />
          Favourite Pairs
        </button>
      </div>
      <div className="relative w-full max-h-[420px] h-full overflow-auto vertical-thin">
        <table className="w-full h-full text-left align-middle">
          <thead>
            <tr className="w-full h-11 sticky top-0 z-10 bg-dark">
              <th className="text-xs font-light w-1/3">Pair</th>
              <th className="text-xs text-right font-light w-1/3">Price(USD)</th>
              <th className="text-xs text-right font-light w-1/3">
                <div className="flex justify-end items-center gap-2">
                  <p>24hChange(%)</p>
                  {!isFav && (
                    <FaArrowCircleDown
                      className="inline-block cursor-pointer"
                      onClick={() => setIsSorting(!isSorting)}
                    />
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3}>
                  <div className="flex items-center justify-center h-48">
                    <img src={loadingGif} alt="loading gif" width={50} />
                  </div>
                </td>
              </tr>
            ) : isFav ? (
              renderPairs(favorites)
            ) : (
              renderPairs(filteredPairs)
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default MarketPair
