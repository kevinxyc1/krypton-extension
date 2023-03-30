import React, { useEffect, useState } from "react";
import { NextPage } from "next";
import { Button, Form, Input, Result } from "antd";
import Link from "next/link";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { StyledForm } from "../../../styles/StyledComponents.styles";
import styles from "../../../components/Layout/index.module.css";
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  AccountLayout,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
  getAccount,
  transferChecked,
  getMint,
} from "@solana/spl-token";
import { useGlobalState } from "../../../context";

import BN from "bn.js";
import { useRouter } from "next/router";
import {
  displayAddress,
  sendAndConfirmTransactionWithAccount,
} from "../../../utils";

const Send: NextPage = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const { walletProgramId, account, setAccount, pda, balance } =
    useGlobalState();
  const [finished, setFinished] = useState<boolean>(false);

  const [form] = Form.useForm();
  const connection = new Connection("https://api.devnet.solana.com/");

  const router = useRouter();
  let { pk } = router.query;
  if (Array.isArray(pk)) {
    pk = pk[0];
  }
  const mint_pk = pk ? new PublicKey(pk) : PublicKey.default;

  const handleCancel = () => {
    router.push({
      pathname: "/nft/[pk]",
      query: { pk: pk },
    });
  };

  const handleOk = async (values: any) => {
    setLoading(true);
    console.log(values);
    const dest_pda = new PublicKey(values.pk);
    const feePayerPk = await account!.getPublicKey();
    let amount = 1;

    console.log("Getting src token account...");
    const srcAssociatedToken = await getAssociatedTokenAddress(
      mint_pk,
      pda ?? PublicKey.default,
      true,
      TOKEN_PROGRAM_ID
    );
    const srcTokenAccount = await getAccount(
      connection,
      srcAssociatedToken,
      "confirmed",
      TOKEN_PROGRAM_ID
    );
    console.log(`Src Token Account: ${srcTokenAccount.address.toBase58()}`);

    console.log("Getting dest associated token address...");
    const associatedToken = await getAssociatedTokenAddress(
      mint_pk,
      dest_pda,
      true,
      TOKEN_PROGRAM_ID
    );

    const destTAInfo = await connection.getAccountInfo(associatedToken);
    console.log(destTAInfo);
    if (!destTAInfo) {
      console.log("Creating token account for mint...");
      const recentBlockhash = await connection.getLatestBlockhash();
      const createTA_tx = new Transaction({
        feePayer: feePayerPk,
        ...recentBlockhash,
      });
      createTA_tx.add(
        createAssociatedTokenAccountInstruction(
          await account!.getPublicKey(),
          associatedToken,
          dest_pda,
          mint_pk,
          TOKEN_PROGRAM_ID
        )
      );

      await sendAndConfirmTransactionWithAccount(
        connection,
        createTA_tx,
        [account!],
        {
          skipPreflight: true,
          preflightCommitment: "confirmed",
          commitment: "confirmed",
        }
      );
    }

    console.log("Getting dest token account...");
    const destTokenAccount = await getAccount(
      connection,
      associatedToken,
      "confirmed",
      TOKEN_PROGRAM_ID
    );
    console.log(`New Token Account: ${destTokenAccount.address.toBase58()}`);

    /* TRANSACTION: Transfer Token */
    const recentBlockhash = await connection.getLatestBlockhash();
    const transferTokenTx = new Transaction({
      feePayer: feePayerPk,
      ...recentBlockhash,
    });

    const idx2 = Buffer.from(new Uint8Array([6]));
    const amountBuf = Buffer.from(
      new Uint8Array(new BN(Number(amount)).toArray("le", 8))
    );
    const recoveryModeBuf = Buffer.from(new Uint8Array([0]));
    const transferAndCloseIx = new TransactionInstruction({
      keys: [
        {
          pubkey: pda ?? PublicKey.default,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: feePayerPk,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: feePayerPk,
          isSigner: true,
          isWritable: true,
        },
        {
          pubkey: srcTokenAccount.address,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: destTokenAccount.address,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: TOKEN_PROGRAM_ID,
          isSigner: false,
          isWritable: false,
        },
      ],
      programId: walletProgramId,
      data: Buffer.concat([idx2, amountBuf, recoveryModeBuf]),
    });

    transferTokenTx.add(transferAndCloseIx);

    console.log("Transfering token...");
    let txid = await sendAndConfirmTransactionWithAccount(
      connection,
      transferTokenTx,
      [account!],
      {
        skipPreflight: true,
        preflightCommitment: "confirmed",
        commitment: "confirmed",
      }
    );
    console.log(`https://explorer.solana.com/tx/${txid}?cluster=devnet\n`);

    setLoading(false);
    setFinished(true);
  };

  return (
    <>
      <h1 className={"title"}>Send NFT</h1>
      <h2 style={{ color: "white" }}>{displayAddress(pk ?? "")}</h2>

      {!finished && (
        <StyledForm
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={handleOk}
        >
          <Form.Item
            name="pk"
            rules={[
              {
                required: true,
                message: "Please enter the recipient's address",
              },
              {
                async validator(_, value) {
                  const pdaInfo = await connection.getAccountInfo(
                    new PublicKey(value)
                  );
                  if (pdaInfo) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Invalid public key"));
                },
              },
            ]}
          >
            <Input
              placeholder="Recipient's Address"
              style={{
                minWidth: "300px",
                backgroundColor: "rgb(34, 34, 34)",
                color: "#d3d3d3",
                border: "1px solid #d3d3d3",
              }}
            />
          </Form.Item>

          <div
            style={{
              display: "flex",
              columnGap: "20px",
              justifyContent: "space-between",
              marginTop: "1px",
              marginBottom: "10px",
              alignItems: "flex-end",
            }}
          >
            <Button
              type="default"
              shape="default"
              style={{ width: "140px", height: "40px", fontSize: "17px" }}
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Form.Item shouldUpdate className="submit">
              {() => (
                <Button
                  htmlType="submit"
                  type="primary"
                  loading={loading}
                  style={{ width: "140px", height: "40px", fontSize: "17px" }}
                >
                  Send
                </Button>
              )}
            </Form.Item>
          </div>
        </StyledForm>
      )}
      {finished && (
        <>
          <Result status="success" title="Sent!" />
          <Link href="/wallet" passHref>
            <a className={styles.back}>
              <ArrowLeftOutlined /> Back Home
            </a>
          </Link>
        </>
      )}
    </>
  );
};

export default Send;
