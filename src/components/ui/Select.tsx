"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import {
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
  dot?: string;
}

interface SelectProps {
  id?: string;
  label?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  options: Option[];
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

export default function Select({
  id,
  label,
  value,
  defaultValue,
  placeholder,
  className,
  error,
  required,
  disabled,
  options,
  onChange,
}: SelectProps) {
  const selectedOption = options.find(
    (option) => option.value === value
  );

  return (
    <div className="w-full min-w-0">
      {label && (
        <label
          htmlFor={id}
          className="mb-2 block text-sm font-medium text-white/70"
        >
          {label}
        </label>
      )}

      <SelectPrimitive.Root
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        onValueChange={(newValue) => {
          onChange?.({
            target: {
              value: newValue,
              name: id,
            },
          } as React.ChangeEvent<HTMLSelectElement>);
        }}
      >
        <SelectPrimitive.Trigger
          id={id}
          aria-required={required}
          className={cn(
            `
              flex h-11 w-full min-w-0
              items-center justify-between gap-2
              rounded-xl border border-white/10
              bg-white/5 px-4
              text-sm text-white
              shadow-sm backdrop-blur-xl
              transition-all
              hover:border-white/20
              focus:border-[var(--accent)]/60
              focus:outline-none
              focus:ring-2
              focus:ring-[var(--accent)]/20
              data-[placeholder]:text-white/30
              disabled:cursor-not-allowed
              disabled:opacity-50
            `,
            error && "border-red-500",
            className
          )}
        >
          <SelectPrimitive.Value
            placeholder={placeholder ?? "Selecione"}
          >
            {selectedOption && (
              <span className="flex min-w-0 items-center gap-2 truncate">
                {selectedOption.dot && (
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      selectedOption.dot
                    )}
                  />
                )}
                <span className="truncate">
                  {selectedOption.label}
                </span>
              </span>
            )}
          </SelectPrimitive.Value>

          <SelectPrimitive.Icon asChild>
            <ChevronDown className="h-4 w-4 shrink-0 text-white/40" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={8}
            collisionPadding={12}
            className="
              z-[100]
              min-w-[var(--radix-select-trigger-width)]
              max-w-[calc(100vw-24px)]
              overflow-hidden
              rounded-xl
              border border-white/10
              bg-[#0A1120]
              shadow-2xl shadow-black/60
              backdrop-blur-2xl
            "
          >
            <SelectPrimitive.ScrollUpButton
              className="
                flex h-8 cursor-pointer items-center justify-center
                bg-[#0A1120] text-white/50
                hover:text-white
              "
            >
              <ChevronUp className="h-4 w-4" />
            </SelectPrimitive.ScrollUpButton>

            <SelectPrimitive.Viewport
              className="
                w-full p-2
                overflow-y-auto
                overscroll-contain
                [scrollbar-width:thin]
                [scrollbar-color:rgba(255,255,255,0.25)_transparent]
              "
              style={{
                maxHeight:
                  "min(280px, var(--radix-select-content-available-height, 60vh))",
              }}
            >
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  className="
                    relative flex w-full
                    cursor-pointer select-none
                    items-center rounded-lg
                    py-2.5 pl-10 pr-4
                    text-sm text-white/80
                    outline-none transition-colors
                    hover:bg-white/10
                    focus:bg-white/10
                    data-[state=checked]:bg-[var(--accent)]/15
                    data-[state=checked]:text-white
                    data-[disabled]:pointer-events-none
                    data-[disabled]:opacity-40
                  "
                >
                  <span className="absolute left-3 flex h-4 w-4 items-center justify-center">
                    <SelectPrimitive.ItemIndicator>
                      <Check className="h-4 w-4 text-[var(--accent)]" />
                    </SelectPrimitive.ItemIndicator>
                  </span>

                  <SelectPrimitive.ItemText>
                    <span className="flex min-w-0 items-center gap-2">
                      {option.dot && (
                        <span
                          className={cn(
                            "h-2 w-2 shrink-0 rounded-full",
                            option.dot
                          )}
                        />
                      )}
                      <span className="break-words">
                        {option.label}
                      </span>
                    </span>
                  </SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>

            <SelectPrimitive.ScrollDownButton
              className="
                flex h-8 cursor-pointer items-center justify-center
                bg-[#0A1120] text-white/50
                hover:text-white
              "
            >
              <ChevronDown className="h-4 w-4" />
            </SelectPrimitive.ScrollDownButton>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>

      {error && (
        <p className="mt-1 text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
