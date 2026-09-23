import type { Wallet } from "./types";

export const INITIAL_COINS = 0;

export function createWallet(coins = INITIAL_COINS): Wallet {
  return {
    coins: Math.max(0, Math.floor(coins)),
  };
}

export function addCoins(
  wallet: Wallet,
  amount: number,
): Wallet {
  if (!Number.isFinite(amount) || amount <= 0) {
    return wallet;
  }

  return {
    coins: wallet.coins + Math.floor(amount),
  };
}

export function spendCoins(
  wallet: Wallet,
  amount: number,
): Wallet | null {
  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    wallet.coins < amount
  ) {
    return null;
  }

  return {
    coins: wallet.coins - Math.floor(amount),
  };
}
