import { Input, Label } from '@go-tech-frontend/ui';
import { cn } from '@go-tech/utils';
import type { LucideIcon } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';

export function SectionCard({
  children,
  description,
  icon: Icon,
  title
}: {
  children: ReactNode;
  description: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="flex items-start gap-3 border-b border-border p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
          <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-medium text-foreground">{title}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="space-y-4 p-4">{children}</div>
    </section>
  );
}

export function FormField({ children, id, label }: { children: ReactNode; id: string; label: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function NumberField({
  byte = false,
  className,
  id,
  label,
  onChange,
  price = false,
  value,
  ...props
}: {
  byte?: boolean;
  id: string;
  label: string;
  onChange: (value: number | undefined) => void;
  price?: boolean;
  value: number | undefined;
} & Omit<ComponentProps<typeof Input>, 'id' | 'onChange' | 'type' | 'value'>) {
  return (
    <FormField id={id} label={label}>
      <div className="relative">
        {price && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">HK$</span>}
        <Input
          {...props}
          id={id}
          type="number"
          min={0}
          step={price ? '0.01' : '1'}
          className={cn(
            'peer',
            price && 'pl-12',
            byte &&
              'appearance-[textfield] pr-12 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
            className
          )}
          value={value ?? ''}
          onChange={event => onChange(event.target.value === '' ? undefined : event.target.valueAsNumber)}
        />
        {byte && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 select-none text-xs text-muted-foreground transition-colors peer-focus-visible:text-foreground peer-disabled:opacity-50">
            GB
          </span>
        )}
      </div>
    </FormField>
  );
}
