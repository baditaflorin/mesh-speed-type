import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMockRoom } from "@baditaflorin/mesh-common/testing";
import { Feature, PHRASES, accuracyFor, phraseForRound, wpmFor } from "../../src/Feature";
import { config } from "../../src/config";

describe("Speed Type", () => {
  it("selects prompts deterministically for every peer", () => {
    expect(phraseForRound(0)).toBe(PHRASES[0]);
    expect(phraseForRound(PHRASES.length)).toBe(PHRASES[0]);
    expect(accuracyFor("abc", "axc")).toBe(67);
    expect(wpmFor("hello", 60_000)).toBe(1);
  });

  it("renders the game while connected", () => {
    render(<Feature room={createMockRoom()} config={config} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Type fast");
    expect(screen.getByPlaceholderText("Name on the board")).toBeInTheDocument();
  });

  it("keeps a useful joining state before the room exists", () => {
    render(<Feature room={null} config={config} />);
    expect(screen.getByText(/Joining room/)).toBeInTheDocument();
  });
});
