'use client';
import { useRef, useEffect } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

/**
 * Renders a Chart.js chart on a <canvas> element.
 * Automatically destroys and recreates the chart when the config prop changes.
 */
export default function ChartCanvas({ config }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (chartRef.current) chartRef.current.destroy();
    const ctx = canvasRef.current.getContext('2d');
    chartRef.current = new Chart(ctx, config);
    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [config]);

  return <canvas ref={canvasRef} />;
}
