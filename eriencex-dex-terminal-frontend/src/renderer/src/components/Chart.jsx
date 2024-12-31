import { createChart } from "lightweight-charts";
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { Context } from "../App";

const Chart = React.memo(function Chart(props) {
  const [container, setContainer] = useState(null);
  const handleRef = useCallback((ref) => {
    setContainer(ref);
  }, []);

  return (
    <>
      <div ref={handleRef}>
        {container && <ChartContainer {...props} container={container} />}
      </div>
    </>
  );
});


export const ChartContainer = forwardRef((props, ref) => {
  const { container, layout } = props;

  const chartApiRef = useMemo(() => {
    const api = createChart(container, {
      width: container.clientWidth,
      height: 400,
      layout,
      grid: {
        vertLines: { color: "#2A2D35" },
        horzLines: { color: "#2A2D35" },
      },
    });
    return { api };
  }, [container, layout]);

  useLayoutEffect(() => {
    const handleResize = () => {
      chartApiRef.api.resize(container.clientWidth, 400);
    };

    window.addEventListener("resize", handleResize);

    handleResize();

    return () => {
      chartApiRef.api.remove();
      window.removeEventListener("resize", handleResize);
    };
  }, [chartApiRef,container]); 

  useImperativeHandle(ref, () => chartApiRef.api, [chartApiRef]);

  return (
    <Context.Provider value={chartApiRef}>{props.children}</Context.Provider>
  );
});

export default Chart;