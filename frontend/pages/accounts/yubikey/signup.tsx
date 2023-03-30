import { Button, Form, List, Select, Table } from "antd";
import { getPubkey, PgpCardInfo, signMessage } from "bloss-js";
import { NextPage } from "next";
import { useRouter, withRouter } from "next/router";
import React, { useEffect } from "react";
import { useGlobalState } from "../../../context";
import { KeyOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import {
  displayAddress,
  sendAndConfirmTransactionWithAccount,
} from "../../../utils";
import bs58 from "bs58";
import { StyledForm } from "../../../styles/StyledComponents.styles";
import Link from "next/link";
import styles from "../../../components/Layout/index.module.css";
import {
  Connection,
  PublicKey,
  sendAndConfirmRawTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { YubikeySigner } from "../../../types/account";
import { useGlobalModalContext } from "../../../components/GlobalModal";
import PinentryModal from "../../../components/GlobalModal/PinentryModal";
import TouchConfirmModal from "../../../components/GlobalModal/TouchConfirmModal";

const YubikeySignup: NextPage = () => {
  const router = useRouter();
  const { yubikeyInfo: info } = useGlobalState();

  const infoTable = [
    {
      key: "1",
      name: "Manufacturer",
      value: info?.manufacturer,
    },
    {
      key: "2",
      name: "Serial",
      value: info?.serialNumber,
    },
    {
      key: "3",
      name: "Manufacturer",
      value: info?.manufacturer,
    },
    {
      key: "4",
      name: "Manufacturer",
      value: info?.manufacturer,
    },
  ];
  const columns = [
    {
      title: "Key",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Value",
      dataIndex: "value",
      key: "value",
    },
  ];

  const [form] = Form.useForm();
  const handleOk = () => {
    console.log("Clicked Generate");
  };
  const handleChange = () => {
    console.log("Changed");
  };

  // Demo code that runs once component is loaded.
  // Transfer SOL from big yubi to small yubi using yubikey version of sendAndConfirmTransaction.
  const { showModal, hideModal } = useGlobalModalContext();
  useEffect(() => {
    const bigYubi = "D2760001240103040006205304730000";
    const smallYubi = "D2760001240103040006223637020000";

    const demo = async () => {
      const from = new PublicKey(await getPubkey(bigYubi));
      const to = new PublicKey(await getPubkey(smallYubi));

      const connection = new Connection("https://api.devnet.solana.com/");

      const recentBlockhash = await connection.getLatestBlockhash();
      let transaction = new Transaction({
        feePayer: from,
        ...recentBlockhash,
      }).add(
        SystemProgram.transfer({
          fromPubkey: from,
          toPubkey: to,
          lamports: 1000,
        })
      );

      const sig = await sendAndConfirmTransactionWithAccount(
        connection,
        transaction,

        /// Example of initializing YubikeySigner with callbacks that open
        /// global modals to collect pin from user and prompt for touch
        /// confirmation. Uses the functions provided in useGlobalModalContext()
        /// to control global modals.
        [new YubikeySigner(
          bigYubi,
          () => {
            const promise = new Promise<string>((resolve, reject) => {
              showModal(
                <PinentryModal
                  title={"Please unlock your YubiKey"}
                  description={`Enter PIN for YubiKey ${bigYubi}`}
                  onSubmitPin={(pin: string) => {
                    hideModal();
                    resolve(pin);
                  }}
                  onCancel={() => {
                    hideModal();
                    reject("User cancelled");
                  }}
                ></PinentryModal>
              );
            })
            return promise;
          },
          () => {
            showModal(
              <TouchConfirmModal
                onCancel={() => {
                  hideModal();
                  console.log("User cancelled touch");
                }}
              ></TouchConfirmModal>);
          },
          hideModal,
        )],
      );

      return sig;
    };

    demo().then((sig) => console.log(`SIGNATURE: ${sig}`));
  }, []);

  return (
    <>
      <h1 className={"title"}>Initialize YubiKey Wallet</h1>
      <div>
        <KeyOutlined style={{ fontSize: "50px", color: "#fff" }} />
        <Table
          dataSource={infoTable}
          columns={columns}
          pagination={false}
          showHeader={false}
        />
      </div>
      <StyledForm
        form={form}
        layout="vertical"
        autoComplete="off"
        requiredMark={false}
        onFinish={handleOk}
      >
        <div style={{ overflow: "hidden" }}>
          <Form.Item name="thres">
            <Select
              defaultValue="2"
              style={{ width: 150 }}
              onChange={handleChange}
              options={[
                { value: "2", label: "2" },
                { value: "3", label: "3" },
                { value: "4", label: "4" },
                { value: "5", label: "5" },
              ]}
            />
          </Form.Item>
        </div>

        <Form.Item shouldUpdate className="submit">
          {() => (
            <Button htmlType="submit" type="primary">
              Generate
            </Button>
          )}
        </Form.Item>
        <Link href="/" passHref>
          <a className={styles.back}>
            <ArrowLeftOutlined /> Back Home
          </a>
        </Link>
      </StyledForm>
    </>
  );
};

export default withRouter(YubikeySignup);

/*
<h2 style={{ fontWeight: "bold", color: "#fff" }}>{`${info?.manufacturer} Card (no. ${info?.serialNumber})`}</h2>
      <p style={{ color: "#bbb" }}><b>OpenPGP AID:</b> {info?.aid}</p>
      <p style={{ color: "#bbb" }}><b>Signing algorithm:</b> {info?.signingAlgo}</p>
      <p style={{ color: "#bbb" }}><b>Public key:</b> {displayAddress(bs58.encode(info?.pubkeyBytes ?? []))}</p>
*/
