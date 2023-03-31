import { Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction, ConfirmOptions, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
import { DATA_PROGRAM_ID, PDA_SEED, AVATAR_PROGRAM_ID } from "./constants";
import { svgPKs } from "./svg-pubkeys";

export const generateAvatar = async (connection: Connection, wallet: Keypair, identity: PublicKey, update: () => void) => {
    const feePayer = wallet;
  
    // data account of avatar
    let dataAccount: PublicKey;
    let pdaData: PublicKey;
      const dataAccountKP = new Keypair();
      const rentExemptAmount = await connection.getMinimumBalanceForRentExemption(
        200
      );
      const createIx = SystemProgram.createAccount({
        fromPubkey: feePayer.publicKey,
        newAccountPubkey: dataAccountKP.publicKey,
        lamports: rentExemptAmount,
        space: 200,
        programId: DATA_PROGRAM_ID,
      });
      const createTx = new Transaction();
      createTx.add(createIx);
      const createTxid = await sendAndConfirmTransaction(
        connection,
        createTx,
        [feePayer, dataAccountKP],
        {
          skipPreflight: true,
          preflightCommitment: "confirmed",
          confirmation: "confirmed",
        } as ConfirmOptions
      );
      console.log(
        `create: https://explorer.solana.com/tx/${createTxid}?cluster=devnet`
      );

      [pdaData] = PublicKey.findProgramAddressSync(
        [Buffer.from(PDA_SEED, "ascii"), dataAccountKP.publicKey.toBuffer()],
        DATA_PROGRAM_ID
      );
      const idx0 = Buffer.from(new Uint8Array([0]));
      const space = new BN(200).toArrayLike(Buffer, "le", 8);
      const dynamic = Buffer.from(new Uint8Array([1]));
      const authority = wallet.publicKey.toBuffer();
      const is_created = Buffer.from(new Uint8Array([1]));
      const false_flag = Buffer.from(new Uint8Array([0]));
      const initializeIx = new TransactionInstruction({
        keys: [
          {
            pubkey: wallet.publicKey,
            isSigner: true,
            isWritable: true,
          },
          {
            pubkey: dataAccountKP.publicKey,
            isSigner: true,
            isWritable: true,
          },
          {
            pubkey: pdaData,
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: SystemProgram.programId,
            isSigner: false,
            isWritable: false,
          },
        ],
        programId: DATA_PROGRAM_ID,
        data: Buffer.concat([
          idx0,
          authority,
          space,
          dynamic,
          is_created,
          false_flag,
        ]),
      });
      const initializeTx = new Transaction();
      initializeTx.add(initializeIx);
      const initializeTxid = await sendAndConfirmTransaction(
        connection,
        initializeTx,
        [feePayer, dataAccountKP],
        {
          skipPreflight: true,
          preflightCommitment: "confirmed",
          confirmation: "confirmed",
        } as ConfirmOptions
      );
      console.log(
        `init: https://explorer.solana.com/tx/${initializeTxid}?cluster=devnet`
      );
      update();
      dataAccount = dataAccountKP.publicKey;
  
    const initializeIdentityIx = new TransactionInstruction({
      keys: [
        {
          pubkey: feePayer.publicKey,
          isSigner: true,
          isWritable: true,
        },
        {
          pubkey: dataAccount,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: pdaData,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: DATA_PROGRAM_ID,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: SystemProgram.programId,
          isSigner: false,
          isWritable: false,
        },
      ],
      programId: AVATAR_PROGRAM_ID,
      data: Buffer.concat([Buffer.from(new Uint8Array([0])), identity.toBuffer()]),
    });
    initializeIdentityIx.keys.push({
      pubkey: svgPKs["env"][0],
      isSigner: false,
      isWritable: false,
    });
    initializeIdentityIx.keys.push({
      pubkey: svgPKs["head"][0],
      isSigner: false,
      isWritable: false,
    });
    const initializeIdentityTx = new Transaction();
    initializeIdentityTx.add(initializeIdentityIx);
    const initializeIdentityTxid = await sendAndConfirmTransaction(
      connection,
      initializeIdentityTx,
      [feePayer],
      {
        skipPreflight: true,
        preflightCommitment: "confirmed",
        confirmation: "confirmed",
      } as ConfirmOptions
    );
    console.log(
      `start: https://explorer.solana.com/tx/${initializeIdentityTxid}?cluster=devnet`
    );
    update();
  
    const appendIdentityCloIx = new TransactionInstruction({
      keys: [
        {
          pubkey: feePayer.publicKey,
          isSigner: true,
          isWritable: true,
        },
        {
          pubkey: dataAccount,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: pdaData,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: DATA_PROGRAM_ID,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: SystemProgram.programId,
          isSigner: false,
          isWritable: false,
        },
      ],
      programId: AVATAR_PROGRAM_ID,
      data: Buffer.concat([Buffer.from(new Uint8Array([1])), identity.toBuffer()]),
    });
    svgPKs["clo"].forEach((part) => {
      appendIdentityCloIx.keys.push({
        pubkey: part,
        isSigner: false,
        isWritable: false,
      });
    });
    const appendIdentityCloTx = new Transaction();
    appendIdentityCloTx.add(appendIdentityCloIx);
    const appendIdentityCloTxid = await sendAndConfirmTransaction(
      connection,
      appendIdentityCloTx,
      [feePayer],
      {
        skipPreflight: true,
        preflightCommitment: "confirmed",
        confirmation: "confirmed",
      } as ConfirmOptions
    );
    console.log(
      `clo: https://explorer.solana.com/tx/${appendIdentityCloTxid}?cluster=devnet`
    );
    update();

  
    const appendIdentityTopIx = new TransactionInstruction({
      keys: [
        {
          pubkey: feePayer.publicKey,
          isSigner: true,
          isWritable: true,
        },
        {
          pubkey: dataAccount,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: pdaData,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: DATA_PROGRAM_ID,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: SystemProgram.programId,
          isSigner: false,
          isWritable: false,
        },
      ],
      programId: AVATAR_PROGRAM_ID,
      data: Buffer.concat([Buffer.from(new Uint8Array([2])), identity.toBuffer()]),
    });
    svgPKs["top"].forEach((part) => {
      appendIdentityTopIx.keys.push({
        pubkey: part,
        isSigner: false,
        isWritable: false,
      });
    });
    const appendIdentityTopTx = new Transaction();
    appendIdentityTopTx.add(appendIdentityTopIx);
    const appendIdentityTopTxid = await sendAndConfirmTransaction(
      connection,
      appendIdentityTopTx,
      [feePayer],
      {
        skipPreflight: true,
        preflightCommitment: "confirmed",
        confirmation: "confirmed",
      } as ConfirmOptions
    );
    console.log(
      `top: https://explorer.solana.com/tx/${appendIdentityTopTxid}?cluster=devnet`
    );
    update();
  
    const appendIdentityEyesIx = new TransactionInstruction({
      keys: [
        {
          pubkey: feePayer.publicKey,
          isSigner: true,
          isWritable: true,
        },
        {
          pubkey: dataAccount,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: pdaData,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: DATA_PROGRAM_ID,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: SystemProgram.programId,
          isSigner: false,
          isWritable: false,
        },
      ],
      programId: AVATAR_PROGRAM_ID,
      data: Buffer.concat([Buffer.from(new Uint8Array([3])), identity.toBuffer()]),
    });
    svgPKs["eyes"].forEach((part) => {
      appendIdentityEyesIx.keys.push({
        pubkey: part,
        isSigner: false,
        isWritable: false,
      });
    });
    const appendIdentityEyesTx = new Transaction();
    appendIdentityEyesTx.add(appendIdentityEyesIx);
    const appendIdentityEyesTxid = await sendAndConfirmTransaction(
      connection,
      appendIdentityEyesTx,
      [feePayer],
      {
        skipPreflight: true,
        preflightCommitment: "confirmed",
        confirmation: "confirmed",
      } as ConfirmOptions
    );
    console.log(
      `eyes: https://explorer.solana.com/tx/${appendIdentityEyesTxid}?cluster=devnet`
    );
    update();
  
    const appendIdentityMouthIx = new TransactionInstruction({
      keys: [
        {
          pubkey: feePayer.publicKey,
          isSigner: true,
          isWritable: true,
        },
        {
          pubkey: dataAccount,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: pdaData,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: DATA_PROGRAM_ID,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: SystemProgram.programId,
          isSigner: false,
          isWritable: false,
        },
      ],
      programId: AVATAR_PROGRAM_ID,
      data: Buffer.concat([Buffer.from(new Uint8Array([4])), identity.toBuffer()]),
    });
    svgPKs["mouth"].forEach((part) => {
      appendIdentityMouthIx.keys.push({
        pubkey: part,
        isSigner: false,
        isWritable: false,
      });
    });
    const appendIdentityMouthTx = new Transaction();
    appendIdentityMouthTx.add(appendIdentityMouthIx);
    const appendIdentityMouthTxid = await sendAndConfirmTransaction(
      connection,
      appendIdentityMouthTx,
      [feePayer],
      {
        skipPreflight: true,
        preflightCommitment: "confirmed",
        confirmation: "confirmed",
      } as ConfirmOptions
    );
    console.log(
      `mouth: https://explorer.solana.com/tx/${appendIdentityMouthTxid}?cluster=devnet`
    );
    update();
  
    const completeIdentityIx = new TransactionInstruction({
      keys: [
        {
          pubkey: feePayer.publicKey,
          isSigner: true,
          isWritable: true,
        },
        {
          pubkey: dataAccount,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: pdaData,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: DATA_PROGRAM_ID,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: SystemProgram.programId,
          isSigner: false,
          isWritable: false,
        },
      ],
      programId: AVATAR_PROGRAM_ID,
      data: Buffer.concat([Buffer.from(new Uint8Array([5]))]),
    });
    const completeIdentityTx = new Transaction();
    completeIdentityTx.add(completeIdentityIx);
    const completeIdentityTxid = await sendAndConfirmTransaction(
      connection,
      completeIdentityTx,
      [feePayer],
      {
        skipPreflight: true,
        preflightCommitment: "confirmed",
        confirmation: "confirmed",
      } as ConfirmOptions
    );
    console.log(
      `complete: https://explorer.solana.com/tx/${completeIdentityTxid}?cluster=devnet`
    );
    update();
    console.log("Data Account: ", dataAccount.toString());
    return dataAccount;
}

export const getAvatar =async (connection:Connection, dataKey: PublicKey) => {
  const data_account = await connection.getAccountInfo(dataKey, "confirmed");
  return data_account?.data;
}