import { ActivityIndicator, Pressable, Text, type PressableProps } from "react-native";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "md" | "sm";

type ButtonProps = Omit<PressableProps, "children"> & {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

const CONTAINER: Record<Variant, string> = {
  primary: "bg-brand active:bg-brand-dark",
  secondary: "border border-slate-300 bg-white active:bg-slate-100",
  danger: "border border-red-200 bg-red-50 active:bg-red-100",
  ghost: "bg-transparent active:bg-slate-100",
};

const LABEL: Record<Variant, string> = {
  primary: "text-white",
  secondary: "text-ink",
  danger: "text-red-700",
  ghost: "text-brand",
};

const SIZE: Record<Size, { container: string; label: string }> = {
  md: { container: "h-12 px-5 rounded-xl", label: "text-base" },
  sm: { container: "h-9 px-3 rounded-lg", label: "text-sm" },
};

export function Button({
  title,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      className={`flex-row items-center justify-center ${SIZE[size].container} ${CONTAINER[variant]} ${isDisabled ? "opacity-50" : ""} ${className ?? ""}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#fff" : "#0F172A"} />
      ) : (
        <Text className={`font-semibold ${SIZE[size].label} ${LABEL[variant]}`}>{title}</Text>
      )}
    </Pressable>
  );
}
