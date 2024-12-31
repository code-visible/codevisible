import { useEffect, useRef, useState } from "react";
import { Depict } from "@pattaya/depict";
import { GraphType, StateCall, StateFile, StatePkg, StateTheme } from '../state';
import { GraphMessageType } from "../message";

import styles from './graph.module.css';
import data from "../data";

export interface GraphProps {
  theme: StateTheme;
  graphType: GraphType;
  setGraphType: (s: GraphType) => void;
  pkg: StatePkg;
  setPkg: (s: StatePkg) => void;
};

const worker = new Worker(new URL('../graph/worker.ts', import.meta.url), {
  type: "module"
});

worker.onerror = (err) => {
  console.log("fail to start the graph worker! ");
  if (err.message) console.log(err.message);
};

const Graph = ({ pkg, theme, graphType, setPkg }: GraphProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [graph, setGraph] = useState<Depict | undefined>(undefined);

  useEffect(() => {
    let g = graph;
    if (!g) {
      const canvas = rootRef.current;
      if (canvas === null) return;
      g = new Depict({
        root: canvas,
        maxLayers: 2,
        worker,
      });
      setGraph(g);
      g.start();
    }

    worker.onmessage = (ev: MessageEvent) => {
      const payload = ev.data.msg;
      switch (ev.data.type) {
        case GraphMessageType.UPDATE_PKG:
          const pkgSet = data.getPkgsByRoot(payload.data.entrance, 12);
          setPkg({ entrance: payload.data.entrance, active: payload.data.active, set: pkgSet });
          break;
      }
    };

    return () => g?.destory();
  }, []);

  useEffect(() => {
    worker.postMessage({ type: GraphMessageType.UPDATE_PKG, msg: { graph: graphType, data: pkg } });
  }, [pkg]);

  useEffect(() => {
    worker.postMessage({ type: GraphMessageType.UPDATE_THEME, msg: theme });
  }, [theme]);

  return (
    <div className={styles.graph}>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
        }}
        ref={rootRef}
      ></div>
    </div>
  );
};

export default Graph;