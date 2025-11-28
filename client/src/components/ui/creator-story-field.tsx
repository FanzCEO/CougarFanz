import { Textarea } from "@/components/ui/textarea";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Control, FieldPath, FieldValues } from "react-hook-form";

interface CreatorStoryFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  placeholder?: string;
  description?: string;
  maxLength?: number;
  required?: boolean;
}

export function CreatorStoryField<T extends FieldValues>({
  control,
  name,
  label = "Tell us about your story",
  placeholder = "Share your story, what makes you unique, your content style...",
  description = "This will appear on your creator profile to help fans connect with you",
  maxLength = 200,
  required = false,
}: CreatorStoryFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label} {required && "*"}</FormLabel>
          <FormControl>
            <div className="relative">
              <Textarea
                {...field}
                className="cyber-input resize-none"
                placeholder={placeholder}
                maxLength={maxLength}
                rows={3}
              />
              <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                {field.value?.length || 0} / {maxLength}
              </div>
            </div>
          </FormControl>
          {description && (
            <FormDescription className="text-xs text-gray-400">
              {description}
            </FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
