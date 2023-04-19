import { PublicKey } from "@solana/web3.js";

export const guardShardMap = new Map<number, PublicKey>();
//export const WALLET_PROGRAM_ID = new PublicKey("2aJqX3GKRPAsfByeMkL7y9SqAGmCQEnakbuHJBdxGaDL");
export const WALLET_PROGRAM_ID = new PublicKey(
  "ACzMztGYvhBWj4y3jvHmjmr6gLFHgaXih1ZuqZiR8evz"
); //shard support

export const CJ_ID = new PublicKey("F1TiLbWFWuKtYhZpzPqiBuTqzpRx4Eb14eaME6XPvP7p");
export const TX_FEE = 5000;
export const MIN_KEYPAIR_BALANCE = 1e8;
export const REFILL_TO_BALANCE = 2e8;
export const PDA_RENT_EXEMPT_FEE = 3152880;
export const KEYPAIR_RENT_EXEMPT_FEE = 890880;
export const TEST_INITIAL_BALANCE_FAILURE = 110204700;
export const TEST_INITIAL_BALANCE_FAILURE_WITHOUT_MINTING = 103157881;
export const MAX_GUARDIANS = 10;
