import type { RadarStats } from '../utils';
import { RADAR_CAPS } from '../utils';

interface RadarChartProps {
  stats: RadarStats;
  size?: number;
  className?: string;
}

type MetricKey = keyof RadarStats;

const METRICS: { key: MetricKey; label: string }[] = [
  { key: 'kda', label: 'KDA' },
  { key: 'dpm', label: '分均伤害' },
  { key: 'gpm', label: '分均经济' },
  { key: 'vspm', label: '分均视野' },
  { key: 'kp', label: '参团率' },
  { key: 'dtpm', label: '分均承伤' },
];

function fmtVal(key: MetricKey, v: number): string {
  switch (key) {
    case 'kda': return v.toFixed(2);
    case 'dpm': return Math.round(v).toString();
    case 'gpm': return Math.round(v).toString();
    case 'vspm': return v.toFixed(1);
    case 'kp': return Math.round(v) + '%';
    case 'dtpm': return Math.round(v).toString();
  }
}

// 逻辑中心坐标(CX, CY) 和最大半径 MAX_R
const CX = 140;
const CY = 140;
const MAX_R = 85;
const LEVELS = [0.2, 0.4, 0.6, 0.8, 1.0];

/** 获取六边形第 i 个顶点的坐标（i=0 为顶部，顺时针） */
function vertex(r: number, i: number): { x: number; y: number } {
  // -Math.PI / 2 是为了让第一个点（i=0）出现在正上方（12点钟方向）
  // i * (Math.PI / 3) 表示每隔 60度（π/3 弧度）放置一个点
  const angle = -Math.PI / 2 + i * (Math.PI / 3);
  return {
    x: CX + r * Math.cos(angle), // 基础圆周运动公式：x = r * cos(θ)
    y: CY + r * Math.sin(angle), // 基础圆周运动公式：y = r * sin(θ)
  };
}

/** 生成六边形路径字符串 */
function hexPath(r: number): string {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const v = vertex(r, i);
    return `${v.x},${v.y}`;
  });
  return pts.join(' ');
}

export function RadarChart({ stats, size = 280, className }: RadarChartProps) {
  const values: number[] = METRICS.map((m) => {
    const raw = stats[m.key];
    const cap = RADAR_CAPS[m.key];
    return Math.min(raw / cap, 1);
  });

  // 数据多边形顶点坐标
  const dataPts = values.map((v, i) => vertex(v * MAX_R, i));

  // 数据多边形路径
  const dataPath = dataPts.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <svg
      viewBox="0 0 280 280"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="玩家表现六边形图"
    >
      {/* 背景网格：5 层同心六边形 */}
      {LEVELS.map((level) => (
        <polygon
          key={level}
          points={hexPath(level * MAX_R)}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="1"
        />
      ))}

      {/* 轴线：中心到每个顶点 */}
      {Array.from({ length: 6 }, (_, i) => {
        const v = vertex(MAX_R, i);
        return (
          <line
            key={`axis-${i}`}
            x1={CX}
            y1={CY}
            x2={v.x}
            y2={v.y}
            stroke="hsl(var(--border))"
            strokeWidth="1"
          />
        );
      })}

      {/* 数据多边形 */}
      <polygon
        points={dataPath}
        fill="#f59e0b"
        fillOpacity="0.12"
        stroke="#f59e0b"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* 数据点 */}
      {dataPts.map((p, i) => (
        <circle
          key={`dot-${i}`}
          cx={p.x}
          cy={p.y}
          r="3"
          fill="#f59e0b"
        />
      ))}

      {/* 数值标注 */}
      {dataPts.map((p, i) => {
        const m = METRICS[i];
        const raw = stats[m.key];
        const text = fmtVal(m.key, raw);

        // 将标注沿轴线方向稍向外偏移
        const angle = -Math.PI / 2 + i * (Math.PI / 3);
        const labelR = values[i] * MAX_R + 10;
        const lx = CX + labelR * Math.cos(angle);
        const ly = CY + labelR * Math.sin(angle);

        // 水平对齐
        let anchor: 'start' | 'middle' | 'end' = 'middle';
        if (lx > CX + 20) anchor = 'start';
        else if (lx < CX - 20) anchor = 'end';

        return (
          <text
            key={`val-${i}`}
            x={lx}
            y={ly}
            textAnchor={anchor}
            dominantBaseline="central"
            className="fill-muted-foreground text-[11px]"
            style={{ fontFamily: 'system-ui, sans-serif' }}
          >
            {text}
          </text>
        );
      })}

      {/* 维度标签（六边形外侧） */}
      {METRICS.map((m, i) => {
        const angle = -Math.PI / 2 + i * (Math.PI / 3); // 获取第 i 个角对应的弧度
        const lr = MAX_R + 22; // 半径比六边形大 22 像素
        const lx = CX + lr * Math.cos(angle); // 计算文字的 X 坐标
        const ly = CY + lr * Math.sin(angle); // 计算文字的 Y 坐标

        let anchor: 'start' | 'middle' | 'end' = 'middle';
        if (lx > CX + 15) anchor = 'start';
        else if (lx < CX - 15) anchor = 'end';

        return (
          <text
            key={`label-${i}`}
            x={lx}
            y={ly}
            textAnchor={anchor}
            dominantBaseline="central"
            className="fill-muted-foreground font-medium text-xs"
            style={{ fontFamily: 'system-ui, sans-serif' }}
          >
            {m.label}
          </text>
        );
      })}
    </svg>
  );
}
