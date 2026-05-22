import type { TablerIcon } from "@tabler/icons-react";
import {
  IconBuildingBank,
  IconChartBar,
  IconChartLine,
  IconCoins,
  IconMicrophone,
  IconStar,
  IconTarget,
  IconTrendingUp,
  IconUserDollar,
} from "@tabler/icons-react";

const ICONS: Record<string, TablerIcon> = {
  "ti-building-bank": IconBuildingBank,
  "ti-user-dollar": IconUserDollar,
  "ti-chart-bar": IconChartBar,
  "ti-trending-up": IconTrendingUp,
  "ti-star": IconStar,
  "ti-chart-line": IconChartLine,
  "ti-coins": IconCoins,
  "ti-target": IconTarget,
  "ti-microphone": IconMicrophone,
};

interface MetricIconProps {
  name: string;
  className?: string;
}

export function MetricIcon({ name, className }: MetricIconProps) {
  const Icon = ICONS[name];
  if (!Icon) return null;
  return <Icon className={className} size={22} stroke={1.5} aria-hidden />;
}
