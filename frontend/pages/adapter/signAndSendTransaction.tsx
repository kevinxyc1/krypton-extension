/*global chrome*/
import React, { useEffect, useState } from "react";
import { NextPage } from "next";
import { Form, Input, Button } from "antd";
import bs58 from "bs58";
import nacl from "tweetnacl";

import {
  Connection,
  Keypair,
  PublicKey,
  VersionedMessage,
  VersionedTransaction,
} from "@solana/web3.js";

const SignAndSendTransaction: NextPage = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [origin, setOrigin] = useState<string>("");
  const [sig, setSig] = useState<string>("");
  const [id, setId] = useState<number>(0);
  const [pk, setPk] = useState<PublicKey>(PublicKey.default);

  useEffect(() => {
    chrome.storage.sync.get(["searchParams", "sk"]).then(async (result) => {
      if (result.searchParams == undefined || result.sk == undefined) {
        return;
      }
      const search = result.searchParams;
      const origin = search.origin;
      const request = JSON.parse(search.request);
      console.log("request: ", request);
      const payload = bs58.decode(request.params.message);
      console.log("payload: ", payload);
      const options = request.params.network;
      console.log("options: ", options);

      const connection = new Connection("https://api.devnet.solana.com/");
      const { blockhash } = await connection.getLatestBlockhash();

      const secretKey = bs58.decode(result.sk);
      const currKeypair = Keypair.fromSecretKey(secretKey);

      const message = VersionedMessage.deserialize(payload);
      message.recentBlockhash = blockhash;
      const transaction = new VersionedTransaction(message);
      transaction.sign([currKeypair]);

      const signature = await connection.sendTransaction(transaction, options);
      console.log("sig: ", signature);

      setPk(currKeypair.publicKey);
      setId(request.id);
      setOrigin(origin);
      setSig(signature);
    });
  }, []);

  const handleCancel = () => {
    window.close();
  };

  const postMessage = (message: any) => {
    // eslint-disable-next-line no-undef
    chrome.runtime.sendMessage({
      channel: "salmon_extension_background_channel",
      data: message,
    });
  };

  const handleSubmit = async () => {
    postMessage({
      method: "signAndSendTransaction",
      result: {
        signature: sig,
        publicKey: pk,
      },
      id: id,
    });
    await new Promise((resolve) => setTimeout(resolve, 300));
    window.close();
  };

  return (
    <>
      <h1 className={"title"}>Approve Transaction</h1>
      <p>{origin}</p>
      <p style={{ marginTop: "20px", textAlign: "left", width: "75%" }}>
        Estimated Changes:
      </p>
      <div
        style={{
          height: "70px",
          backgroundColor: "#2a2a2a",
          width: "75%",
          textAlign: "center",
          justifyContent: "center",
          display: "flex",
          flexDirection: "column",
        }}
      >
        No changes
      </div>

      <div
        style={{
          display: "flex",
          columnGap: "20px",
          justifyContent: "space-between",
          marginTop: "170px",
          alignItems: "flex-end",
          height: "380px",
          position: "absolute",
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
        <Button
          htmlType="submit"
          type="primary"
          loading={loading}
          style={{ width: "140px", height: "40px", fontSize: "17px" }}
          onClick={handleSubmit}
        >
          Approve
        </Button>
      </div>
    </>
  );
};

export default SignAndSendTransaction;