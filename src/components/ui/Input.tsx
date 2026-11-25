import { Text, TextInput, View, type TextInputProps } from "react-native";

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
};

export function Input({ label, error, className, ...rest }: InputProps) {
  return (
    <View className="gap-1.5">
      {label ? <Text className="text-sm font-medium text-slate-700">{label}</Text> : null}
      <TextInput
        placeholderTextColor="#94A3B8"
        className={`h-12 rounded-xl border bg-white px-4 text-base text-ink ${error ? "border-red-500" : "border-slate-300"} ${className ?? ""}`}
        {...rest}
      />
      {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
    </View>
  );
}
