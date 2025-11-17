import { describe, expect, it } from "vitest";
import { normalizeEventCard, normalizeEventDeck, type RawEventCard } from "./normalize-event-cards";

describe("normalizeEventCard", () => {
  it("returns card as-is when no options provided", () => {
    const raw: RawEventCard = {
      id: "plain",
      title: "Без вариантов",
      flavor: "",
      effect: "Применяется автоматически.",
      type: "mystery",
    };

    const normalized = normalizeEventCard(raw);
    expect(normalized).toBe(raw);
    expect(normalized.choices).toBeUndefined();
  });

  it("converts options into event choices with normalized effects", () => {
    const raw: RawEventCard = {
      id: "water_silhouette",
      title: "Силуэт у воды",
      flavor: "",
      effect: "",
      type: "mystery",
      options: [
        {
          id: "approach",
          label: "Приблизиться",
          chance: 0.25,
          success_text: "Успех",
          fail_text: "Провал",
          effect: {
            onSuccess: { clue: 1, sanity: 2 },
            onFail: { sanity: 2, wound: 1, omen: 1, cold: 2, fear: 1 },
          },
        },
      ],
    };

    const normalized = normalizeEventCard(raw);
    expect(normalized.choices).toHaveLength(1);
    const choice = normalized.choices?.[0];
    expect(choice?.successText).toBe("Успех");
    expect(choice?.failText).toBe("Провал");
    expect(choice?.chance).toBe(0.25);
    expect(choice?.successEffects?.cluesGained).toBe(1);
    expect(choice?.successEffects?.statDeltas).toEqual([{ statId: "sanity", delta: -2 }]);
    expect(choice?.failEffects?.statDeltas).toEqual([
      { statId: "sanity", delta: -2 },
      { statId: "health", delta: -1 },
    ]);
    expect(choice?.failEffects?.doomDelta).toBe(1);
    expect(choice?.failEffects?.coldDelta).toBe(2);
    expect(choice?.failEffects?.fearDelta).toBe(1);
  });
});

describe("normalizeEventDeck", () => {
  it("normalizes each card in the deck", () => {
    const rawDeck: RawEventCard[] = [
      {
        id: "plain",
        title: "Без вариантов",
        flavor: "",
        effect: "",
        type: "mystery",
      },
      {
        id: "water_silhouette",
        title: "Силуэт у воды",
        flavor: "",
        effect: "",
        type: "mystery",
        options: [
          {
            id: "step_back",
            label: "Отступить",
            chance: 1,
            success_text: "Успех",
            effect: { onSuccess: { sanity: 1, omen: 1 } },
          },
        ],
      },
    ];

    const normalized = normalizeEventDeck(rawDeck);
    expect(normalized).toHaveLength(2);
    expect(normalized[0].choices).toBeUndefined();
    expect(normalized[1].choices?.[0].successEffects?.statDeltas).toEqual([
      { statId: "sanity", delta: -1 },
    ]);
    expect(normalized[1].choices?.[0].successEffects?.doomDelta).toBe(1);
  });
});
