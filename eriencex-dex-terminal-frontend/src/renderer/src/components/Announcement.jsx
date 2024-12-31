import React from "react";
import Marquee from "react-fast-marquee";

const Announcement = () => {
  return (
    <>
      <div className="relative bg-semi-dark text-xs text-light-gray">
        <Marquee>
          <div className="container">
            <div className="relative w-full py-4 flex items-center justify-between gap-x-8 whitespace-nowrap overflow-x-auto horizonal-thin">
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
      </div>
    </>
  );
};

export default Announcement;
