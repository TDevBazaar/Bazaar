import {
  ShoppingCart,
  CreditCard,
  Smartphone,
  BarChart3,
  Truck,
  ShieldCheck,
  LayoutGrid,
  SlidersHorizontal,
  Search,
  RefreshCw,
  CalendarCheck,
  Bell,
  PieChart,
  PenTool,
  Settings,
  Layers,
  Headphones,
  Wrench,
  Cpu,
  Home,
  Stethoscope,
  Sparkles,
  Zap,
  FileText,
  Download,
} from "lucide-react";
import type { ServiceIconKey } from "@/data/services";

const iconMap = {
  "shopping-cart": ShoppingCart,
  "credit-card": CreditCard,
  smartphone: Smartphone,
  "bar-chart": BarChart3,
  truck: Truck,
  shield: ShieldCheck,
  "layout-grid": LayoutGrid,
  filter: SlidersHorizontal,
  search: Search,
  refresh: RefreshCw,
  calendar: CalendarCheck,
  bell: Bell,
  "pie-chart": PieChart,
  "pen-tool": PenTool,
  settings: Settings,
  layers: Layers,
  headphones: Headphones,
  wrench: Wrench,
  cpu: Cpu,
  home: Home,
  stethoscope: Stethoscope,
  sparkles: Sparkles,
  zap: Zap,
  "file-text": FileText,
  download: Download,
};

export function ServiceIcon({
  name,
  className = "h-5 w-5",
}: {
  name: ServiceIconKey;
  className?: string;
}) {
  const Icon = iconMap[name] ?? ShieldCheck;
  return <Icon className={className} aria-hidden="true" />;
}
