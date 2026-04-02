import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import {
  ActionButton,
  Field,
  PillInput,
  SelectInput,
  TextArea,
  TextInput
} from "./form-controls";

const meta = {
  title: "UI/Form Controls"
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function PillInputDemo() {
  const [value, setValue] = useState(["chorus", "upbeat", "demo"]);

  return (
    <div className="grid max-w-xl gap-3">
      <Field label="Tags">
        <PillInput value={value} onChange={setValue} />
      </Field>
      <p className="text-sm text-[color:var(--muted)]">Parsed values: {value.join(" | ")}</p>
    </div>
  );
}

export const Inputs: Story = {
  render: () => (
    <div className="grid max-w-xl gap-4">
      <Field label="Track title">
        <TextInput placeholder="Midnight chorus" />
      </Field>
      <Field label="Status">
        <SelectInput options={["Idea", "Draft", "Review", "Released"]} defaultValue="Draft" />
      </Field>
      <Field label="Notes">
        <TextArea
          rows={5}
          defaultValue="Focus the second verse on the pre-chorus melody."
        />
      </Field>
    </div>
  )
};

export const TagInput: Story = {
  render: () => <PillInputDemo />
};

export const ButtonGroup: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <ActionButton>Save</ActionButton>
      <ActionButton tone="ghost">Cancel</ActionButton>
      <ActionButton tone="danger">Archive</ActionButton>
      <ActionButton disabled>Disabled</ActionButton>
    </div>
  )
};
