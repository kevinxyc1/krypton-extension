/*global chrome*/
import React, { useEffect, useState } from "react";
import { NextPage } from "next";
import { Form, Input, Button } from "antd";
import bs58 from "bs58";
import nacl from "tweetnacl";

import { Keypair, PublicKey } from "@solana/web3.js";

const Sign: NextPage = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [origin, setOrigin] = useState<string>("");
  const [sig, setSig] = useState<string>("");
  const [msg, setMsg] = useState<string>("");
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

      const data = new Uint8Array(Object.keys(request.params.data).length);
      for (const index in request.params.data) {
        data[Number(index)] = request.params.data[index];
      }
      console.log("data: ", data);

      const msg = new TextDecoder("utf8").decode(data);
      console.log("msg: ", msg);

      const secretKey = bs58.decode(result.sk);
      const currKeypair = Keypair.fromSecretKey(secretKey);
      const sig = bs58.encode(nacl.sign.detached(data, secretKey));
      console.log("sig: ", sig);
      
      setMsg(msg);
      setPk(currKeypair.publicKey);
      setId(request.id);
      setOrigin(origin);
      setSig(sig);
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
      method: "sign",
      result: {
        signature: sig,
        publicKey: pk,
      },
      id: id,
    });
    await new Promise((resolve) => setTimeout(resolve, 100));
    window.close();
  };

  return (
    <>
      <h1 className={"title"}>Sign Message</h1>
      <p>{origin}</p>
      <p style={{ marginTop: "20px", textAlign: "left", width: "75%" }}>
        message:
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
        {msg}
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

export default Sign;