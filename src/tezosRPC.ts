/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable no-console */
import { InMemorySigner } from "@taquito/signer";
import { TezosToolkit } from "@taquito/taquito";
import { hex2buf } from "@taquito/utils";
// @ts-ignore
import * as tezosCrypto from "@tezos-core-tools/crypto-utils";
import { IProvider } from "@web3auth/base";

const tezos = new TezosToolkit("https://ghostnet.ecadinfra.com");
export default class TezosRpc {
  private provider: IProvider;

  constructor(provider: IProvider) {
    this.provider = provider;
  }
  
  getCurrentBlockNumber = async (): Promise<number> => {
    try {
      const block = await tezos.rpc.getBlock();
      return block.header.level;
    } catch (error) {
      console.error("Error getting current block number:", error);
      return -1;
    }
  };
  
  getTezosKeyPair = async (): Promise<any> => {
    try {
      const privateKey = (await this.provider.request({ method: "private_key" })) as string;
      const keyPair = tezosCrypto.utils.seedToKeyPair(hex2buf(privateKey));
      return keyPair;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  setProvider = async () => {
    const keyPair = await this.getTezosKeyPair();
    if (keyPair) {
      // use TacoInfra's RemoteSigner for better security on mainnet..
      tezos.setSignerProvider(await InMemorySigner.fromSecretKey(keyPair.sk as string));
    } else {
      console.error("Key pair is undefined or null.");
    }
  };

  getAccounts = async () => {
    try {
      const keyPair = await this.getTezosKeyPair();
      return keyPair?.pkh;
    } catch (error) {
      console.error("Error", error);
    }
  };


}
