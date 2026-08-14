import { PieChart } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DistItem } from "../lib/distribution";
import { formatCurrency } from "../lib/format";

interface Props {
  title: string;
  items: DistItem[];
}

interface TooltipPayloadEntry {
  value: number;
  payload: DistItem;
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadEntry[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <span className="chart-tooltip-swatch" style={{ background: item.color }} />
      <span className="chart-tooltip-label">{item.label}</span>
      <span className="chart-tooltip-value">{formatCurrency(item.value)}</span>
    </div>
  );
}

export function DistribuicaoChart({ title, items }: Props) {
  const total = items.reduce((soma, item) => soma + item.value, 0);
  const height = Math.max(items.length * 38 + 12, 96);

  return (
    <div className="card chart-card">
      <div className="card-header">
        <h2>{title}</h2>
        {total > 0 && <span className="card-header-total">{formatCurrency(total)}</span>}
      </div>

      {items.length === 0 ? (
        <div className="empty-state empty-state--chart">
          <PieChart size={22} strokeWidth={1.5} />
          <p>Nenhum gasto neste mês</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={items} layout="vertical" margin={{ top: 2, right: 72, bottom: 2, left: 0 }}>
            <CartesianGrid horizontal={false} stroke="var(--gridline)" />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="label"
              width={104}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--text-secondary)", fontSize: 12.5 }}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--page)" }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={16} isAnimationActive={false}>
              {items.map((item) => (
                <Cell key={item.label} fill={item.color} />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                formatter={(value: unknown) => formatCurrency(Number(value))}
                style={{ fill: "var(--text-primary)", fontSize: 12, fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
