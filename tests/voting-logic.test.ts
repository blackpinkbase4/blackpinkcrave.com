import { describe, it, expect, beforeEach } from "vitest";
import { normalizeXUsername, validateXUsername, validateAllocations } from "../src/lib/validation";
import { createSessionToken, isValidSessionToken } from "../src/lib/auth";
import {
  submitVotes,
  getVoterBalance,
  submitNomination,
  toggleFinalistStatus,
  updateEventSettings,
  getCategoryResults,
} from "../src/lib/supabase/db";
import { Nominee } from "../src/types";

describe("1. Username Normalization & Validation", () => {
  it("normalizes standard handle with single leading @", () => {
    expect(normalizeXUsername("@stantwt")).toBe("stantwt");
  });

  it("normalizes multiple leading @ and trims surrounding whitespace", () => {
    expect(normalizeXUsername("   @@@KpopCharts_26   ")).toBe("kpopcharts_26");
  });

  it("converts uppercase characters to lowercase", () => {
    expect(normalizeXUsername("@NOIR_AWARDS")).toBe("noir_awards");
  });

  it("rejects empty or whitespace-only inputs", () => {
    const res = validateXUsername("   ");
    expect(res.isValid).toBe(false);
    expect(res.error).toBeDefined();
  });

  it("rejects usernames containing illegal symbols like spaces or emojis", () => {
    const res1 = validateXUsername("invalid user!");
    expect(res1.isValid).toBe(false);

    const res2 = validateXUsername("stan🔥twitter");
    expect(res2.isValid).toBe(false);
  });

  it("accepts valid alphanumeric and underscore handles", () => {
    const res = validateXUsername("@chart_data_2026");
    expect(res.isValid).toBe(true);
    expect(res.normalized).toBe("chart_data_2026");
  });
});

describe("2. Vote Allocations & Rules", () => {
  const dummyNominees: Nominee[] = [
    {
      id: "nom_a",
      category_id: "best-fanbase",
      x_username: "fanbase_a",
      display_name: "Fanbase Alpha",
      is_finalist: true,
    },
    {
      id: "nom_b",
      category_id: "best-fanbase",
      x_username: "fanbase_b",
      display_name: "Fanbase Beta",
      is_finalist: true,
    },
    {
      id: "nom_inactive",
      category_id: "best-fanbase",
      x_username: "inactive_user",
      display_name: "Inactive User",
      is_finalist: false,
    },
  ];

  it("allocates exactly 10 votes to a single nominee correctly", () => {
    const res = validateAllocations([{ nominee_id: "nom_a", votes: 10 }], 10, dummyNominees);
    expect(res.isValid).toBe(true);
    expect(res.totalVotes).toBe(10);
  });

  it("splits 10 votes across multiple nominees (e.g. 7 and 3)", () => {
    const res = validateAllocations(
      [
        { nominee_id: "nom_a", votes: 7 },
        { nominee_id: "nom_b", votes: 3 },
      ],
      10,
      dummyNominees
    );
    expect(res.isValid).toBe(true);
    expect(res.totalVotes).toBe(10);
  });

  it("rejects allocations exceeding remaining voter credits", () => {
    const res = validateAllocations([{ nominee_id: "nom_a", votes: 5 }], 4, dummyNominees);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain("exceeds your remaining allowance");
  });

  it("rejects allocations above 10 total votes", () => {
    const res = validateAllocations([{ nominee_id: "nom_a", votes: 12 }], 10, dummyNominees);
    expect(res.isValid).toBe(false);
  });

  it("rejects non-positive or zero vote units", () => {
    const res = validateAllocations([{ nominee_id: "nom_a", votes: 0 }], 10, dummyNominees);
    expect(res.isValid).toBe(false);
  });

  it("rejects unapproved finalists / inactive nominees", () => {
    const res = validateAllocations(
      [{ nominee_id: "nom_inactive", votes: 3 }],
      10,
      dummyNominees
    );
    expect(res.isValid).toBe(false);
    expect(res.error).toContain("invalid or inactive");
  });

  it("rejects duplicate allocations to the same nominee in one ballot", () => {
    const res = validateAllocations(
      [
        { nominee_id: "nom_a", votes: 3 },
        { nominee_id: "nom_a", votes: 2 },
      ],
      10,
      dummyNominees
    );
    expect(res.isValid).toBe(false);
    expect(res.error).toContain("Duplicate nominee");
  });
});

describe("3. Database State & End-to-End Voting Enforcement", () => {
  const testCategory = "best-fanbase";
  let nom1: Nominee;
  let nom2: Nominee;

  beforeEach(async () => {
    await updateEventSettings({
      nominations_open: true,
      voting_open: true,
      voting_deadline: new Date(Date.now() + 86400000).toISOString(),
      winners_published: false,
    });

    try {
      const created1 = await submitNomination({
        category_id: testCategory,
        x_username: `nom1_${Date.now()}`,
        display_name: "Nominee One",
      });
      nom1 = await toggleFinalistStatus(created1.id, true);

      const created2 = await submitNomination({
        category_id: testCategory,
        x_username: `nom2_${Date.now()}`,
        display_name: "Nominee Two",
      });
      nom2 = await toggleFinalistStatus(created2.id, true);
    } catch {}
  });

  it("allows casting partial votes and accurately tracks remaining balance", async () => {
    const uniqueUser = `voter_${Date.now()}`;
    const initialBalance = await getVoterBalance(uniqueUser, testCategory);
    expect(initialBalance.votes_remaining).toBe(10);
    expect(initialBalance.votes_used).toBe(0);

    // Cast 4 votes for nom1
    const sub1 = await submitVotes(uniqueUser, testCategory, [
      { nominee_id: nom1.id, votes: 4 },
    ]);
    expect(sub1.success).toBe(true);
    expect(sub1.remaining_votes).toBe(6);

    const midBalance = await getVoterBalance(uniqueUser, testCategory);
    expect(midBalance.votes_remaining).toBe(6);
    expect(midBalance.votes_used).toBe(4);

    // Cast remaining 6 votes (split 3 and 3)
    const sub2 = await submitVotes(uniqueUser, testCategory, [
      { nominee_id: nom1.id, votes: 3 },
      { nominee_id: nom2.id, votes: 3 },
    ]);
    expect(sub2.success).toBe(true);
    expect(sub2.remaining_votes).toBe(0);

    // Attempting to cast any more votes must fail
    const sub3 = await submitVotes(uniqueUser, testCategory, [
      { nominee_id: nom1.id, votes: 1 },
    ]);
    expect(sub3.success).toBe(false);
    expect(sub3.error).toContain("Exceeded 10 vote limit");
  });

  it("strictly enforces hard ceiling across concurrent vote attempts", async () => {
    const concurrentUser = `burst_${Date.now()}`;

    const promises = [
      submitVotes(concurrentUser, testCategory, [{ nominee_id: nom1.id, votes: 5 }]),
      submitVotes(concurrentUser, testCategory, [{ nominee_id: nom1.id, votes: 5 }]),
      submitVotes(concurrentUser, testCategory, [{ nominee_id: nom1.id, votes: 5 }]),
    ];

    const results = await Promise.all(promises);
    const successCount = results.filter((r) => r.success).length;

    expect(successCount).toBeLessThanOrEqual(2);

    const finalBalance = await getVoterBalance(concurrentUser, testCategory);
    expect(finalBalance.votes_used).toBeLessThanOrEqual(10);
    expect(finalBalance.votes_remaining).toBeGreaterThanOrEqual(0);
  });

  it("rejects vote submissions when voting is closed", async () => {
    await updateEventSettings({ voting_open: false });

    const user = `closed_test_${Date.now()}`;
    const res = await submitVotes(user, testCategory, [{ nominee_id: nom1.id, votes: 2 }]);
    expect(res.success).toBe(false);
    expect(res.error).toContain("closed");

    await updateEventSettings({ voting_open: true });
  });

  it("rejects vote submissions when voting deadline has passed", async () => {
    await updateEventSettings({
      voting_deadline: new Date(Date.now() - 100000).toISOString(),
    });

    const user = `deadline_test_${Date.now()}`;
    const res = await submitVotes(user, testCategory, [{ nominee_id: nom1.id, votes: 1 }]);
    expect(res.success).toBe(false);
    expect(res.error).toContain("deadline has passed");

    await updateEventSettings({
      voting_deadline: new Date(Date.now() + 86400000).toISOString(),
    });
  });
});

describe("4. Security, Privacy & Admin Authorization", () => {
  it("keeps results hidden when winners_published is false", async () => {
    await updateEventSettings({ winners_published: false });
    const results = await getCategoryResults(true);
    expect(results).toBeNull();
  });

  it("reveals results when winners_published is true", async () => {
    await updateEventSettings({ winners_published: true });
    const results = await getCategoryResults(true);
    expect(results).not.toBeNull();
    expect(Array.isArray(results)).toBe(true);
  });

  it("validates legitimate admin HMAC session tokens", () => {
    const token = createSessionToken();
    expect(isValidSessionToken(token)).toBe(true);
  });

  it("rejects forged or expired admin session tokens", () => {
    expect(isValidSessionToken("fake.token123")).toBe(false);
    expect(isValidSessionToken("")).toBe(false);
    expect(isValidSessionToken(null)).toBe(false);
  });
});
