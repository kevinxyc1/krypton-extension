import React, { useEffect, useState } from "react";
import { NextPage } from "next";
import { Button, Form, Input, Result } from "antd";
import Link from "next/link";
import { ArrowLeftOutlined } from "@ant-design/icons";
import styles from "../../components/Layout/index.module.css";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

import { useRouter } from "next/router";
import { useGlobalState } from "../../context";
import { StyledForm } from "../../styles/StyledComponents.styles";
//import {str2hex,init,getConfig,setRNG,share} from "secrets.js-grempe"
import { combine, split } from "shamirs-secret-sharing-ts";
import * as aesjs from "aes-js";
import base58 from "bs58";
import { genShards } from "../../utils/stealth";
import { StealthSigner } from "../../types/account";
import { parseDataFromPDA } from "../../types/pda";

const RegenStealth: NextPage = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const { account, setAccount, balance, network } = useGlobalState();
  const [finished, setFinished] = useState<boolean>(false);
  const [thres, setThres] = useState<number>(0);
  const [privScan, setPrivScan] = useState<string>("");
  const [privSpend, setPrivSpend] = useState<string>("");
  const [succeeded, setSucceeded] = useState<boolean>(false);
  const connection = new Connection(clusterApiUrl(network), "confirmed");

  const [form] = Form.useForm();
  const router = useRouter();

  useEffect(() => {
    // Fetching all guardians from PDA
    const getGuardians = async () => {
      if (!account) {
        return;
      }

      const connection = new Connection(clusterApiUrl(network), "confirmed");
      const publicKey = new PublicKey(account.pk);
      console.log("account pk: ", publicKey.toBase58());
      console.log("PDA: ", account.pda);
      const pda_account = await connection.getAccountInfo(
        new PublicKey(account.pda) ?? PublicKey.default
      );
      const pda_data = pda_account?.data ?? Buffer.from("");
      const pdaDataObj = parseDataFromPDA(pda_data);
      const threshold = pdaDataObj.recoveryThreshold;
      const guardian_len = pdaDataObj.guardiansLen;
      console.log("threshold: ", threshold);
      console.log("guardian length: ", guardian_len);

      const pScan = pdaDataObj.privScan;
      const pSpend = pdaDataObj.privSpend;

      setThres(threshold);
      setPrivScan(pScan);
      setPrivSpend(pSpend);
    };
    getGuardians();
  }, [account, network]);

  const handleCancel = async () => {
    if (!account) {
      router.push("/stealth");
      return;
    }
    const shards_buffs = account.stealth.shards.map((str) =>
      Buffer.from(base58.decode(str))
    );
    const encryption_key = combine(shards_buffs);
    const [acc, _] = await genShards(encryption_key, account, network);
    setAccount(acc);
    router.push("/stealth");
  };

  const handleOk = async (values: any) => {
    console.log("values here: ", values);

    Object.entries(values).forEach(([key, val]) => {
      console.log(key, val);
    });

    if (!account) {
      return;
    }
    let newPrivScan: string;
    let newPrivSpend: string;
    try {
      let shards = Object.entries(values).map(([key, val]) =>
        Buffer.from(base58.decode(val as string))
      );
      console.log("shards:", shards);
      setLoading(true);
      setFinished(false);
      console.log("stealth scan: ", account.stealth.priv_scan);
      console.log("stealth spend: ", account.stealth.priv_spend);

      const priv_scan_enc = privScan;
      const priv_spend_enc = privSpend;

      const result = combine(shards);
      console.log("result: ", result);
      const aesCtr = new aesjs.ModeOfOperation.ctr(result);
      newPrivScan = base58.encode(aesCtr.decrypt(base58.decode(priv_scan_enc)));
      console.log("privscan: ", newPrivScan);
      newPrivSpend = base58.encode(
        aesCtr.decrypt(base58.decode(priv_spend_enc))
      );
      console.log("privspend: ", newPrivSpend);

      //checking validity

      const pubscan = await new StealthSigner(newPrivScan).getPublicKey();
      console.log("Pub Scan: ", pubscan);
      const pubspend = await new StealthSigner(newPrivSpend).getPublicKey();
      console.log("Pub Spend: ", pubspend);
    } catch {
      console.log("invalid shards");
      console.log("refreshing shards instead");
      const shards_buffs = account.stealth.shards.map((str) =>
        Buffer.from(base58.decode(str))
      );
      const encryption_key = combine(shards_buffs);
      const [acc, _] = await genShards(encryption_key, account, network);
      setAccount(acc);
      setSucceeded(false);
      setLoading(false);
      setFinished(true);
      return;
    }

    let prev_acc = account;
    prev_acc.stealth.priv_scan = newPrivScan;
    prev_acc.stealth.priv_spend = newPrivSpend;
    setAccount(prev_acc);

    await chrome.storage.local
      .get(["currId", "accounts", "y_accounts", "mode", "y_id"])
      .then(async (result) => {
        const id = result["mode"] === 0 ? result["currId"] : result["y_id"];
        const old =
          result["mode"] === 0
            ? JSON.parse(result["accounts"])
            : JSON.parse(result["y_accounts"]);

        const { priv_scan: _, priv_spend: __, ...rest } = old[id];
        old[id] = {
          priv_scan: prev_acc.stealth.priv_scan,
          priv_spend: prev_acc.stealth.priv_spend,
          ...rest,
        };
        const accs = JSON.stringify(old);

        if (result["mode"] === 0) {
          chrome.storage.local.set({
            accounts: accs,
          });
        } else if (result["mode"] === 1) {
          chrome.storage.local.set({
            y_accounts: accs,
          });
        }
      });

    setLoading(false);
    setFinished(true);
    setSucceeded(true);
  };

  return (
    <>
      <h1 className={"title"}>RegenStealth</h1>

      {!finished && (
        <StyledForm
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={handleOk}
        >
          <div
            style={{ overflowY: "auto", height: "250px", padding: "0 10px" }}
          >
            {[...new Array(thres)].map((_, idx) => {
              return (
                <Form.Item
                  key={idx}
                  name={idx}
                  rules={[
                    {
                      required: true,
                      message: "Please enter the shard",
                    },
                  ]}
                >
                  <Input
                    placeholder={`Shard ${idx + 1}`}
                    style={{
                      minWidth: "300px",
                      backgroundColor: "rgb(34, 34, 34)",
                      color: "#d3d3d3",
                      border: "1px solid #d3d3d3",
                    }}
                  />
                </Form.Item>
              );
            })}
          </div>

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
      {finished && succeeded && (
        <>
          <Result status="success" title="Recovered!" />
          <Link href="/stealth" passHref>
            <a className={styles.back}>
              <ArrowLeftOutlined /> Back Home
            </a>
          </Link>
        </>
      )}
      {finished && !succeeded && (
        <>
          <Result
            status="error"
            title="Failed"
            subTitle="Your stealth account could not be recovered"
          />

          <Link href="/stealth" passHref>
            <a className={styles.back}>
              <ArrowLeftOutlined /> Back Home
            </a>
          </Link>
        </>
      )}
    </>
  );
};

export default RegenStealth;