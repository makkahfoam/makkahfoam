"use client";

import React, { useState, useEffect } from "react";
import { cn, handleNumericZeroReplace } from "@/lib/utils";

export interface NumericInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: number | string;
  onChangeValue?: (val: number) => void;
  allowDecimals?: boolean;
  prefixSymbol?: string;
  suffixSymbol?: string;
}

export const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  (
    {
      value,
      onChangeValue,
      allowDecimals = true,
      prefixSymbol,
      suffixSymbol,
      className,
      disabled,
      placeholder = "0",
      ...props
    },
    ref
  ) => {
    // Keep local string state to allow typing empty or partial numbers (like "5.")
    const [displayVal, setDisplayVal] = useState<string>(() => {
      if (value === undefined || value === null) return "0";
      return String(value);
    });

    useEffect(() => {
      // Synchronize with incoming external value if different
      const strVal = value === undefined || value === null ? "0" : String(value);
      if (Number(strVal) !== Number(displayVal) && !(displayVal === "" && Number(strVal) === 0)) {
        setDisplayVal(strVal);
      }
    }, [value]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Auto-select text on focus so typing immediately replaces initial value (including 0)
      e.target.select();
      props.onFocus?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;

      // Clean leading zeros (e.g. typing 5 when display is 0 produces "5", not "05")
      let cleaned = handleNumericZeroReplace(displayVal, raw);

      // Validate numeric characters
      if (allowDecimals) {
        // allow digits and one optional decimal point
        cleaned = cleaned.replace(/[^0-9.]/g, "");
        const parts = cleaned.split(".");
        if (parts.length > 2) {
          cleaned = `${parts[0]}.${parts.slice(1).join("")}`;
        }
      } else {
        cleaned = cleaned.replace(/[^0-9]/g, "");
      }

      setDisplayVal(cleaned);

      const parsedNum = cleaned === "" || cleaned === "." ? 0 : parseFloat(cleaned);
      onChangeValue?.(isNaN(parsedNum) ? 0 : parsedNum);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (displayVal === "" || displayVal === ".") {
        setDisplayVal("0");
        onChangeValue?.(0);
      } else {
        // Normalize
        const parsedNum = parseFloat(displayVal);
        const finalVal = isNaN(parsedNum) ? "0" : String(parsedNum);
        setDisplayVal(finalVal);
        onChangeValue?.(isNaN(parsedNum) ? 0 : parsedNum);
      }
      props.onBlur?.(e);
    };

    return (
      <div className="relative flex items-center w-full">
        {prefixSymbol && (
          <span className="absolute left-3 text-xs font-semibold text-muted-foreground select-none pointer-events-none">
            {prefixSymbol}
          </span>
        )}
        <input
          ref={ref}
          type="text"
          inputMode={allowDecimals ? "decimal" : "numeric"}
          disabled={disabled}
          value={displayVal}
          placeholder={placeholder}
          onFocus={handleFocus}
          onChange={handleChange}
          onBlur={handleBlur}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono tracking-tight text-right",
            prefixSymbol && "pl-8",
            suffixSymbol && "pr-8",
            className
          )}
          {...props}
        />
        {suffixSymbol && (
          <span className="absolute right-3 text-xs font-semibold text-muted-foreground select-none pointer-events-none">
            {suffixSymbol}
          </span>
        )}
      </div>
    );
  }
);

NumericInput.displayName = "NumericInput";