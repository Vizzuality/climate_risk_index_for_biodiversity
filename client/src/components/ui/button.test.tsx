import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders its children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("applies the variant class", () => {
    render(<Button variant="link">Area name</Button>);
    expect(screen.getByRole("button", { name: "Area name" })).toHaveClass("underline-offset-4");
  });
});
