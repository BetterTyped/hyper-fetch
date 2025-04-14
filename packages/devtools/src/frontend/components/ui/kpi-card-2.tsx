import { cn } from "frontend/lib/utils";

interface KpiCard1Props {
  value: React.ReactNode;
  label: React.ReactNode;
  icon: React.ReactNode;
  color?: keyof typeof colors;
  children?: React.ReactNode;
}

const colors = {
  blue: "from-blue-500/10 to-blue-800/10",
  purple: "from-purple-500/10 to-purple-800/10",
  green: "from-green-500/10 to-green-800/10",
  red: "from-red-500/10 to-red-800/10",
  yellow: "from-yellow-500/10 to-yellow-800/10",
  orange: "from-orange-500/10 to-orange-800/10",
  pink: "from-pink-500/10 to-pink-800/10",
  gray: "from-gray-500/10 to-gray-800/10",
  black: "from-black/10 to-black/10",
  white: "from-white/10 to-white/10",
};

const iconColors = {
  blue: "bg-blue-800/30 text-blue-600",
  purple: "bg-purple-800/30 text-purple-600",
  green: "bg-green-800/30 text-green-600",
  red: "bg-red-800/30 text-red-600",
  yellow: "bg-yellow-800/30 text-yellow-600",
  orange: "bg-orange-800/30 text-orange-600",
  pink: "bg-pink-800/30 text-pink-600",
  gray: "bg-gray-800/30 text-gray-600",
  black: "bg-black/30 text-black",
  white: "bg-white/30 text-white",
};

export const KpiCard1 = ({ value, label, children, icon, color = "blue" }: KpiCard1Props) => {
  return (
    <div className={cn(`bg-gradient-to-br rounded-xl p-6 shadow-sm`, colors[color])}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={cn(`p-2 rounded-lg`, iconColors[color])}>{icon}</div>
          <div>
            <p className="text-sm text-gray-400">{label}</p>
            <p className="text-2xl font-semibold text-gray-300">{value}</p>
          </div>
        </div>
      </div>
      {children && <div className="text-sm text-gray-500 mt-4">{children}</div>}
    </div>
  );
};
