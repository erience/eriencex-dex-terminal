import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectData } from '../redux-toolkit/dataSlice';

const CopybotLogs = () => {
    const { copyBotLog } = useSelector(selectData)

    useEffect(() => {
        console.log({ copyBotLog });
    }, [copyBotLog])


    return (
        <>CopybotLogs</>
    )
}

export default CopybotLogs