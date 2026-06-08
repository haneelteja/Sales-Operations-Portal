import { onCLS, onFCP, onFID, onINP, onLCP, onTTFB } from 'web-vitals';

type Metric = {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
};

function logMetric(metric: Metric) {
  const { name, value, rating } = metric;
  const rounded = Math.round(name === 'CLS' ? value * 1000 : value);
  const unit = name === 'CLS' ? '' : 'ms';
  console.info(`[Web Vitals] ${name}: ${rounded}${unit} (${rating})`);
}

export function reportWebVitals() {
  onCLS(logMetric);
  onFCP(logMetric);
  onFID(logMetric);
  onINP(logMetric);
  onLCP(logMetric);
  onTTFB(logMetric);
}
