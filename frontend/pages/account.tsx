import React, { useEffect, useState } from "react";
import { NextPage } from "next";
import { Typography } from "antd";
import { useGlobalState } from "../context";
import { Dashboard } from "../styles/StyledComponents.styles";
import { Keypair, PublicKey } from "@solana/web3.js";
import { ArrowLeftOutlined } from "@ant-design/icons";
import bs58 from "bs58";
import Link from "next/link";
import styles from "../components/Layout/index.module.css";
import { useRouter } from "next/router";

const { Paragraph } = Typography;
const programId = new PublicKey("2aJqX3GKRPAsfByeMkL7y9SqAGmCQEnakbuHJBdxGaDL");

const Account: NextPage = () => {
  const { account, pda, setAccount, setPDA } = useGlobalState();

  const displayAddress = (address: string) =>
    `${address.slice(0, 4)}...${address.slice(-4)}`;

  const router = useRouter();

  useEffect(() => {
    chrome.storage.sync.get(["sk"]).then(async (result) => {
      if (result.sk == undefined) {
        router.push("/");
        return;
      }
      //console.log("Value currently is " + result.sk);
      const currKeypair = Keypair.fromSecretKey(bs58.decode(result.sk));
      setAccount(currKeypair);
      //console.log("account: ", account?.publicKey.toBase58());
      const profile_pda = PublicKey.findProgramAddressSync(
        [
          Buffer.from("profile", "utf-8"),
          account?.publicKey.toBuffer() ?? new Buffer(""),
        ],
        programId ?? PublicKey.default
      );
      setPDA(profile_pda[0]);
      //console.log("PDA: ", profile_pda[0].toBase58());
    });
  }, []);

  return (
    <>
      {account && (
        <Dashboard>
          <h1>Account Public Keys</h1>

          <Paragraph
            copyable={{ text: account.publicKey.toBase58(), tooltips: `Copy` }}
          >
            {`Keypair: ${displayAddress(account.publicKey.toBase58())}`}
          </Paragraph>

          <Paragraph copyable={{ text: pda?.toBase58(), tooltips: `Copy` }}>
            {`Wallet (PDA): ${displayAddress(pda?.toBase58() ?? "")}`}
          </Paragraph>
          <Link href="/wallet" passHref>
            <a className={styles.back}>
              <ArrowLeftOutlined /> Back Home
            </a>
          </Link>
        </Dashboard>
      )}
    </>
  );
};

export default Account;
