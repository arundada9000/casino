import { AppError } from "@/core/error";
import { MIN_BET, MAX_BET, type GameEngine, type GameId, type GameRoundContext } from "@/core/game-engine";
import { shuffle, type Rng } from "@/core/randomness";
import {
  DECK,
  handValue,
  isBust,
  isNatural,
  type Card,
} from "./cards";
import { BLACKJACK_DECKS, BLACKJACK_NATURAL, BLACKJACK_PAYOUT } from "./config";
import type { BetHand, BlackjackResult, BlackjackState } from "./types";

export const BLACKJACK_REVEAL_MS = 1100;

const CODE = "blackjack:invalid-state";

export class BlackjackEngine implements GameEngine<BlackjackState, BlackjackResult> {
  readonly gameId: GameId = "blackjack";
  readonly version = "1.0.0";

  constructor(private readonly rng: Rng) {}

  beginRound(ctx: GameRoundContext, options?: unknown): BlackjackState {
    const o = options as { wager?: unknown } | undefined;
    if (!o || typeof o.wager !== "number" || !Number.isInteger(o.wager)) {
      throw new AppError(CODE, "wager must be a whole number of credits.");
    }
    if (o.wager < MIN_BET || o.wager > MAX_BET) {
      throw new AppError(CODE, `wager must be between ${MIN_BET} and ${MAX_BET} credits.`);
    }
    let shoe: readonly Card[] = shuffle([...this.buildShoe()], this.rng);
    const draw = (): { card: Card; next: readonly Card[] } => {
      const res = this.drawCard(shoe);
      shoe = res.shoe;
      return { card: res.card, next: res.shoe };
    };
    const up = draw();
    const hole = draw();
    const p1 = draw();
    const p2 = draw();
    return {
      roundId: ctx.roundId,
      startedAt: ctx.startedAt,
      shoe,
      dealer: [up.card, hole.card],
      hands: [{ cards: [p1.card, p2.card], bet: o.wager, doubled: false, split: false, done: isNatural([p1.card, p2.card]) }],
      activeHand: 0,
      stake: o.wager,
    };
  }

  /** Draw one more card for the active hand. */
  hit(_ctx: GameRoundContext, state: BlackjackState): BlackjackState {
    const current = this.activeHand(state);
    if (current.done) {
      throw new AppError(CODE, "this hand has already finished.");
    }
    const card = this.drawCard(state.shoe);
    const cards = [...current.cards, card.card];
    const done = isBust(cards) || handValue(cards).total === 21;
    const nextHands = state.hands.map((hand, index) =>
      index === state.activeHand ? { ...hand, cards, done } : hand,
    );
    return this.advance({ ...state, shoe: card.shoe, hands: nextHands });
  }

  /** End the active hand's turn. */
  stand(_ctx: GameRoundContext, state: BlackjackState): BlackjackState {
    const current = this.activeHand(state);
    if (current.done) {
      throw new AppError(CODE, "this hand has already finished.");
    }
    const nextHands = state.hands.map((hand, index) =>
      index === state.activeHand ? { ...hand, done: true } : hand,
    );
    return this.advance({ ...state, hands: nextHands });
  }

  /** Double the active hand's wager, receive exactly one card. */
  double(_ctx: GameRoundContext, state: BlackjackState): BlackjackState {
    const current = this.activeHand(state);
    if (current.cards.length !== 2) {
      throw new AppError(CODE, "double is only available on two cards.");
    }
    if (current.done) {
      throw new AppError(CODE, "this hand has already finished.");
    }
    const card = this.drawCard(state.shoe);
    const cards = [...current.cards, card.card];
    const nextHands = state.hands.map((hand, index) =>
      index === state.activeHand
        ? { ...hand, cards, doubled: true, done: true }
        : hand,
    );
    return this.advance({
      ...state,
      shoe: card.shoe,
      hands: nextHands,
      stake: state.stake + current.bet,
    });
  }

  /** Split a pair into two independent hands (one split per round). */
  split(_ctx: GameRoundContext, state: BlackjackState): BlackjackState {
    const current = this.activeHand(state);
    if (state.hands.length > 1) {
      throw new AppError(CODE, "a hand can only be split once.");
    }
    if (current.cards.length !== 2 || current.cards[0]?.rank !== current.cards[1]?.rank) {
      throw new AppError(CODE, "split requires a matching pair.");
    }
    if (current.done) {
      throw new AppError(CODE, "this hand has already finished.");
    }
    const hole = current.cards[0] as Card;
    const extra = current.cards[1] as Card;
    const cardA = this.drawCard(state.shoe);
    const cardB = this.drawCard(cardA.shoe);
    const firstCards = [hole, cardA.card];
    const secondCards = [extra, cardB.card];
    const first: BetHand = {
      cards: firstCards,
      bet: current.bet,
      doubled: false,
      split: true,
      done: handValue(firstCards).total === 21,
    };
    const second: BetHand = {
      cards: secondCards,
      bet: current.bet,
      doubled: false,
      split: true,
      done: handValue(secondCards).total === 21,
    };
    return {
      ...state,
      shoe: cardB.shoe,
      hands: [first, second],
      activeHand: 0,
      stake: state.stake + current.bet,
    };
  }

  /**
   * Dealer plays to S17, then every hand is settled against the dealer.
   * Requires all player hands to be finished.
   */
  finishRound(_ctx: GameRoundContext, state: BlackjackState): BlackjackResult {
    if (state.hands.some((hand) => !hand.done)) {
      throw new AppError(CODE, "player hands must finish before resolution.");
    }
    const dealer = this.playDealer(state.shoe, state.dealer);
    const dealerTotal = handValue(dealer.cards).total;
    const dealerBust = isBust(dealer.cards);
    const dealerNatural = isNatural(dealer.cards);

    let winPayout = 0;
    let pushRefund = 0;
    let wonAny = false;
    let pushedAny = false;
    let naturalWon = false;

    for (const hand of state.hands) {
      const doubled = hand.doubled;
      const effective = hand.bet * (doubled ? 2 : 1);
      const playerTotal = handValue(hand.cards).total;
      const playerBust = isBust(hand.cards);
      const playerNatural = isNatural(hand.cards) && !hand.split;

      if (playerBust) {
        continue;
      }
      if (dealerBust) {
        if (playerNatural) {
          winPayout += effective * BLACKJACK_NATURAL;
          naturalWon = true;
          wonAny = true;
        } else {
          winPayout += effective * BLACKJACK_PAYOUT;
          wonAny = true;
        }
        continue;
      }
      if (playerNatural && dealerNatural) {
        pushRefund += effective;
        pushedAny = true;
        continue;
      }
      if (playerNatural) {
        winPayout += effective * BLACKJACK_NATURAL;
        naturalWon = true;
        wonAny = true;
        continue;
      }
      if (dealerNatural) {
        continue;
      }
      if (playerTotal > dealerTotal) {
        winPayout += effective * BLACKJACK_PAYOUT;
        wonAny = true;
      } else if (playerTotal === dealerTotal) {
        pushRefund += effective;
        pushedAny = true;
      }
    }

    const outcome = wonAny ? "win" : pushedAny ? "push" : "loss";
    return {
      dealer: dealer.cards,
      hands: state.hands,
      outcome,
      blackjack: naturalWon,
      stake: state.stake,
      winPayout,
      pushRefund,
    };
  }

  private buildShoe(): readonly Card[] {
    const cards: Card[] = [];
    for (let d = 0; d < BLACKJACK_DECKS; d += 1) {
      cards.push(...DECK);
    }
    return cards;
  }

  private drawCard(shoe: readonly Card[]): { card: Card; shoe: readonly Card[] } {
    if (shoe.length === 0) {
      const fresh = shuffle(this.buildShoe(), this.rng);
      return this.drawCard(fresh);
    }
    const card = shoe[shoe.length - 1];
    if (!card) {
      throw new AppError(CODE, "the shoe is empty.");
    }
    return { card, shoe: shoe.slice(0, -1) };
  }

  private playDealer(shoe: readonly Card[], initial: readonly Card[]): { cards: readonly Card[]; shoe: readonly Card[] } {
    let cards = initial;
    let currentShoe = shoe;
    while (handValue(cards).total < 17) {
      const draw = this.drawCard(currentShoe);
      cards = [...cards, draw.card];
      currentShoe = draw.shoe;
    }
    return { cards, shoe: currentShoe };
  }

  private activeHand(state: BlackjackState): BetHand {
    const hand = state.hands[state.activeHand];
    if (!hand) {
      throw new AppError(CODE, "no active hand.");
    }
    return hand;
  }

  private advance(state: BlackjackState): BlackjackState {
    let activeHand = state.activeHand;
    while (state.hands[activeHand]?.done && activeHand < state.hands.length - 1) {
      activeHand += 1;
    }
    return { ...state, activeHand };
  }
}

export function createBlackjackEngine(rng: Rng): BlackjackEngine {
  return new BlackjackEngine(rng);
}