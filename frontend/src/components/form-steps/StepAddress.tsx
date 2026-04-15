import React, { useState, useEffect } from "react";
import { Employee } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { useAppSelector } from "@/hooks/useRedux";

import {
  fetchAllCities,
  fetchStateByCity,
} from "@/redux/features/state/stateSlice";

interface StepProps {
  data: Partial<Employee>;
  onChange: (d: Partial<Employee>) => void;
}

const F = ({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) => {
  const isRequired = label.includes("*");
  const cleanLabel = label.replace("*", "");

  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label className="text-sm font-medium text-black">
        {cleanLabel}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
    </div>
  );
};

export function StepAddress({ data, onChange }: StepProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [sameAddress, setSameAddress] = useState(false);

  const { cities, permanentStates, currentStates } = useAppSelector(
    (state) => state.states,
  );

  useEffect(() => {
    dispatch(fetchAllCities());
  }, [dispatch]);

  // ✅ Store cityName directly (no ID needed, DB has permanentCity varchar)
  const handlePermanentCityChange = (cityName: string) => {
    onChange({
      permanentCity: cityName, // ✅ directly store name
      permanentState: "",
    });

    dispatch(fetchStateByCity({ cityName, type: "permanent" }));

    if (sameAddress) {
      onChange({
        currentCity: cityName,
        currentState: "",
      });
      dispatch(fetchStateByCity({ cityName, type: "current" }));
    }
  };

  const handleCurrentCityChange = (cityName: string) => {
    onChange({
      currentCity: cityName, // ✅ directly store name
      currentState: "",
    });

    dispatch(fetchStateByCity({ cityName, type: "current" }));
  };

  /* Same Address Sync */
  useEffect(() => {
    if (sameAddress && data.permanentCity) {
      onChange({
        currentAddress: data.permanentAddress,
        currentCity: data.permanentCity,
        currentState: data.permanentState,
        currentPincode: data.permanentPincode,
      });

      dispatch(
        fetchStateByCity({
          cityName: data.permanentCity,
          type: "current",
        }),
      );
    }
  }, [
    sameAddress,
    data.permanentAddress,
    data.permanentCity,
    data.permanentState,
    data.permanentPincode,
  ]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Permanent Address */}
      <F label="Permanent Address *" full>
        <Input
          value={data.permanentAddress || ""}
          onChange={(e) => onChange({ permanentAddress: e.target.value })}
          placeholder="Enter Permanent Address"
        />
      </F>

      {/* Permanent City */}
      <F label="Permanent City *">
        <Select
          value={data.permanentCity || ""} // ✅ cityName se select
          onValueChange={handlePermanentCityChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select City" />
          </SelectTrigger>
          <SelectContent>
            {cities.map((city) => (
              <SelectItem key={city.id} value={city.cityName}>
                {" "}
                {/* ✅ value = cityName */}
                {city.cityName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </F>

      {/* Permanent State */}
      <F label="Permanent State *">
        <Select
          value={data.permanentState || ""}
          onValueChange={(value) => onChange({ permanentState: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select State" />
          </SelectTrigger>
          <SelectContent>
            {permanentStates.map((state) => (
              <SelectItem key={state.id} value={state.stateName}>
                {state.stateName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </F>

      {/* Permanent Pincode */}
      <F label="Permanent Pincode *">
        <Input
          value={data.permanentPincode || ""}
          maxLength={6}
          onChange={(e) =>
            onChange({ permanentPincode: e.target.value.replace(/\D/g, "") })
          }
          placeholder="Pincode"
        />
      </F>

      {/* Same Address Checkbox */}
      <div className="flex items-center gap-2 sm:col-span-2">
        <input
          type="checkbox"
          checked={sameAddress}
          onChange={(e) => {
            const checked = e.target.checked;
            setSameAddress(checked);

            if (!checked) {
              onChange({
                currentAddress: "",
                currentCity: "",
                currentState: "",
                currentPincode: "",
              });
            } else {
              onChange({
                currentAddress: data.permanentAddress,
                currentCity: data.permanentCity,
                currentState: data.permanentState,
                currentPincode: data.permanentPincode,
              });

              if (data.permanentCity) {
                dispatch(
                  fetchStateByCity({
                    cityName: data.permanentCity,
                    type: "current",
                  }),
                );
              }
            }
          }}
        />
        <Label>Current address same as Permanent</Label>
      </div>

      {/* Current Address */}
      <F label="Current Address *" full>
        <Input
          value={data.currentAddress || ""}
          disabled={sameAddress}
          onChange={(e) => onChange({ currentAddress: e.target.value })}
          placeholder="Enter Current Address"
        />
      </F>

      {/* Current City */}
      <F label="Current City *">
        <Select
          value={data.currentCity || ""} // ✅ cityName se select
          disabled={sameAddress}
          onValueChange={handleCurrentCityChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select City" />
          </SelectTrigger>
          <SelectContent>
            {cities.map((city) => (
              <SelectItem key={city.id} value={city.cityName}>
                {" "}
                {/* ✅ value = cityName */}
                {city.cityName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </F>

      {/* Current State */}
      <F label="Current State *">
        <Select
          value={data.currentState || ""}
          disabled={sameAddress}
          onValueChange={(value) => onChange({ currentState: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select State" />
          </SelectTrigger>
          <SelectContent>
            {currentStates.map((state) => (
              <SelectItem key={state.id} value={state.stateName}>
                {state.stateName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </F>

      {/* Current Pincode */}
      <F label="Current Pincode *">
        <Input
          value={data.currentPincode || ""}
          maxLength={6}
          disabled={sameAddress}
          onChange={(e) =>
            onChange({ currentPincode: e.target.value.replace(/\D/g, "") })
          }
          placeholder="Pincode"
        />
      </F>
    </div>
  );
}
