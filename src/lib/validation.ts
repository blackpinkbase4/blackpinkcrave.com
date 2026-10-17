import { VoteAllocation, Nominee } from "@/types";

/**
 * Normalizes an X / Twitter username:
 * - Trims whitespace
 * - Strips all leading '@' symbols
 * - Converts to lowercase
 */
export function normalizeXUsername(input: string | null | undefined): string {
  if (!input) return "";
  let cleaned = input.trim();
  while (cleaned.startsWith("@")) {
    cleaned = cleaned.substring(1);
  }
  return cleaned.toLowerCase();
}

/**
 * Validates an X handle format according to X guidelines:
 * 1-15 alphanumeric characters and underscores.
 */
export function validateXUsername(input: string | null | undefined): {
  isValid: boolean;
  normalized: string;
  error?: string;
} {
  const normalized = normalizeXUsername(input);

  if (!normalized) {
    return {
      isValid: false,
      normalized: "",
      error: "Please enter your X/Twitter username.",
    };
  }

  // Standard X handle: 1-15 characters, alphanumeric and underscore
  // We allow up to 30 chars to be permissive of varied naming, but require valid characters
  const handleRegex = /^[a-z0-9_]{1,30}$/;
  if (!handleRegex.test(normalized)) {
    return {
      isValid: false,
      normalized,
      error: "Username may only contain letters, numbers, and underscores.",
    };
  }

  return { isValid: true, normalized };
}

/**
 * Validates vote allocations against rules:
 * - Non-empty allocations
 * - Positive integer votes per nominee
 * - Sum must not exceed voter's remaining quota (and maximum 10)
 * - Nominees must be active and present in the category
 */
export function validateAllocations(
  allocations: VoteAllocation[],
  remainingVotes: number,
  categoryNominees: Nominee[]
): {
  isValid: boolean;
  error?: string;
  totalVotes: number;
} {
  if (!allocations || !Array.isArray(allocations) || allocations.length === 0) {
    return { isValid: false, error: "Please allocate at least 1 vote credit.", totalVotes: 0 };
  }

  let totalVotes = 0;
  const eligibleNomineeIds = new Set(
    categoryNominees.filter((n) => n.is_finalist !== false).map((n) => n.id)
  );

  const seenNominees = new Set<string>();

  for (const item of allocations) {
    if (!item.nominee_id || typeof item.nominee_id !== "string") {
      return { isValid: false, error: "Invalid nominee specified.", totalVotes: 0 };
    }

    if (seenNominees.has(item.nominee_id)) {
      return { isValid: false, error: "Duplicate nominee allocation detected.", totalVotes: 0 };
    }
    seenNominees.add(item.nominee_id);

    if (!eligibleNomineeIds.has(item.nominee_id)) {
      return {
        isValid: false,
        error: "One of the selected nominees is invalid or inactive for this category.",
        totalVotes: 0,
      };
    }

    const units = Math.floor(item.votes);
    if (isNaN(units) || units <= 0) {
      return { isValid: false, error: "Vote count must be a positive number.", totalVotes: 0 };
    }

    totalVotes += units;
  }

  if (totalVotes <= 0) {
    return { isValid: false, error: "You must allocate at least 1 vote.", totalVotes: 0 };
  }

  if (totalVotes > remainingVotes) {
    return {
      isValid: false,
      error: `Allocation exceeds your remaining allowance. You allocated ${totalVotes} votes, but only have ${remainingVotes} left.`,
      totalVotes,
    };
  }

  if (totalVotes > 10) {
    return {
      isValid: false,
      error: "Maximum 10 votes can be cast per category.",
      totalVotes,
    };
  }

  return { isValid: true, totalVotes };
}
