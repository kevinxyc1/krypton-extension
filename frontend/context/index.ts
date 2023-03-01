import React, { createContext, useContext } from "react";
import { Keypair, Cluster, PublicKey } from "@solana/web3.js";

export type GlobalContextType = {
  network: Cluster | undefined;
  setNetwork: React.Dispatch<React.SetStateAction<Cluster | undefined>>;
  account: Keypair | null;
  setAccount: React.Dispatch<React.SetStateAction<Keypair | null>>;
  mnemonic: string | null;
  setMnemonic: React.Dispatch<React.SetStateAction<string | null>>;
  balance: number | null;
  setBalance: React.Dispatch<React.SetStateAction<number | null>>;
  guardians: Array<PublicKey>;
  setGuardians: React.Dispatch<React.SetStateAction<Array<PublicKey>>>;
  pda: PublicKey | null;
  setPDA: React.Dispatch<React.SetStateAction<PublicKey | null>>;
  programId: PublicKey | null;
  setProgramId: React.Dispatch<React.SetStateAction<PublicKey | null>>;
  recoverPk: PublicKey | null;
  setRecoverPk: React.Dispatch<React.SetStateAction<PublicKey | null>>;
  tokens: Array<[PublicKey, bigint]>;
  setTokens: React.Dispatch<React.SetStateAction<Array<[PublicKey, bigint]>>>;
};

export const GlobalContext = createContext<GlobalContextType>({
  network: "devnet",
  setNetwork: () => null,
  account: null,
  setAccount: () => null,
  mnemonic: null,
  setMnemonic: () => null,
  balance: null,
  setBalance: () => null,
  guardians: [],
  setGuardians: () => null,
  pda: null,
  setPDA: () => null,
  programId: new PublicKey("2aJqX3GKRPAsfByeMkL7y9SqAGmCQEnakbuHJBdxGaDL"),
  setProgramId: () => null,
  recoverPk: null,
  setRecoverPk: () => null,
  tokens: [],
  setTokens: () => null,
});

export const useGlobalState = () => useContext(GlobalContext);
