import { useState } from "react";
import { Check, ChevronsUpDown, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Patient } from "@/types/patient";

interface PatientSelectProps {
  patients: Patient[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function PatientSelect({
  patients,
  value,
  onValueChange,
  placeholder = "Select a patient...",
  className
}: PatientSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedPatient = patients.find(patient => patient.id === value);

  const getPatientDisplay = (patient: Patient) => 
    `${patient.firstName} ${patient.lastName}`;

  const getPatientSearchText = (patient: Patient) =>
    `${patient.firstName} ${patient.lastName} ${patient.email}`.toLowerCase();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            {selectedPatient ? (
              <span className="truncate">
                {getPatientDisplay(selectedPatient)} - {selectedPatient.email}
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
        <Command>
          <CommandInput placeholder="Search patients..." />
          <CommandList>
            <CommandEmpty>No patients found.</CommandEmpty>
            <CommandGroup>
              {patients.map((patient) => (
                <CommandItem
                  key={patient.id}
                  value={getPatientSearchText(patient)}
                  onSelect={() => {
                    onValueChange(patient.id === value ? "" : patient.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === patient.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {getPatientDisplay(patient)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {patient.email}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
