import React from 'react'
import Marquee from 'react-fast-marquee'

const Footer = () => {
    return (
        <footer className='fixed bottom-0 left-0 w-full bg-dark'>
            <Marquee>
                <div className="container">
                    <div className="relative w-full text-xs py-4 flex items-center justify-center gap-x-8 whitespace-nowrap overflow-x-auto horizonal-thin">
                        <p>
                            This trading terminal is powered by{" "}
                            <a
                                className="primary-color"
                                href="https://eriencex.com"
                                target="_blank"
                            >
                                ErienceX
                            </a>
                            .
                        </p>
                        <p>
                            Build custom trading bots for CEXs and DEXs with{" "}
                            <a
                                className="primary-color"
                                href="https://eriencex.com"
                                target="_blank"
                            >
                                ErienceX
                            </a>
                            .
                        </p>
                        <p>
                            Share feedback and request features from{" "}
                            <a
                                className="primary-color"
                                href="https://eriencex.com"
                                target="_blank"
                            >
                                ErienceX
                            </a>
                            .
                        </p>
                    </div>
                </div>
            </Marquee>
        </footer>
    )
}

export default Footer