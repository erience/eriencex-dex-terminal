import React, {
  forwardRef,
  useContext,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";
import { Context } from "../App";

const Series = React.memo(
  forwardRef((props, ref) => {
    const { type, data, color } = props;
    const chartContext = useContext(Context);
    const seriesRef = useRef(null);

    useLayoutEffect(() => {
      if (!seriesRef.current) {
        seriesRef.current = chartContext.api.addCandlestickSeries({
          upColor: color.upColor,
          downColor: color.downColor,
          borderDownColor: color.borderDownColor,
          borderUpColor: color.borderUpColor,
          wickDownColor: color.wickDownColor,
          wickUpColor: color.wickUpColor,
        });
        seriesRef.current.setData(data);
      }
    }, [data, color, type]);

    useImperativeHandle(ref, () => ({
      update: (newData) => {
        seriesRef.current.update(newData);
      },
    }));

    return null;
  })
);

export default Series;
