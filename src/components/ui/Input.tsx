import { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export default function Input({
  label,
  error,
  icon,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-white">{label}</label>
      )}

      <div className="relative">
        {icon && (
          <div
            className="
              absolute
              left-3
              top-1/2
              -translate-y-1/2
              text-muted
            "
          >
            {icon}
          </div>
        )}

        <input
          {...props}
          className={`
  w-full
  rounded-xl
  border
  bg-white/[0.03]
  px-4
  py-3
  text-white
  placeholder:text-muted
  outline-none
  transition-all
  focus:ring-2

  ${icon ? "pl-11" : ""}
${error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}

  ${className}
`}
        />
      </div>
    </div>
  );
}
