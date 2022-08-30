import { ethers } from "hardhat";
import { BigNumber, Contract } from "ethers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

export const theFuture = (() => {
  // the future is now
  let future = Math.floor((new Date()).getTime() / 1000);
  return {
    // an arbitrary point in the future
    time: () => {
      return future;
    },
    // travel to the future, arrival on next block mined
    travel: async (travel: number = 0) => {
      await ethers.provider.send('evm_setNextBlockTimestamp', [future += travel]);
      return future;
    },
    // mine a block in the future
    arrive: async () => {
      if ( future > await time.latest() ) {
        await ethers.provider.send('evm_mine', []);
      }
    },
    oneDay: 60 * 60 * 24,
    oneMonth: 60 * 60 * 24 * 30,
    oneYear: 60 * 60 * 24 * 365,
  };
})();

export type Implementations = {
  nft: Contract;
  DCNT4907A: Contract;
  crescendo: Contract;
  vault: Contract;
  staking: Contract;
};

export const deploySDK = async (
  implementations?: Implementations
) => {
  implementations = implementations ?? await deployImplementations();
  const decentSDKFactory = await ethers.getContractFactory('DCNTSDK');
  const decentSDK = await decentSDKFactory.deploy(
    implementations.nft.address,
    implementations.DCNT4907A.address,
    implementations.crescendo.address,
    implementations.vault.address,
    implementations.staking.address,
  );
  return await decentSDK.deployed();
}

export const deployImplementations = async () => {
  const nft = await deployContract('DCNT721A');
  const DCNT4907A = await deployContract('DCNT4907A');
  const crescendo = await deployContract('DCNTCrescendo');
  const vault = await deployContract('DCNTVault');
  const staking = await deployContract('DCNTStaking');
  return { nft, DCNT4907A, crescendo, vault, staking };
}

export const deployContract = async (contract: string) => {
  const factory = await ethers.getContractFactory(contract);
  const tx = await factory.deploy();
  return await tx.deployed();
}

export const deploy721A = async (
  decentSDK: Contract,
  name: string,
  symbol: string,
  maxTokens: number,
  tokenPrice: BigNumber,
  maxTokenPurchase: number
) => {
  const deployTx = await decentSDK.deploy721A(
    name,
    symbol,
    maxTokens,
    tokenPrice,
    maxTokenPurchase
  );

  const receipt = await deployTx.wait();
  const newNFTAddress = receipt.events.find((x: any) => x.event === 'NewNFT').args[0];
  return ethers.getContractAt("DCNT721A", newNFTAddress);
}

export const deploy4907A = async (
  decentSDK: Contract,
  name: string,
  symbol: string,
  maxTokens: number,
  tokenPrice: BigNumber,
  maxTokenPurchase: number
) => {
  const deployTx = await decentSDK.deploy4907A(
    name,
    symbol,
    maxTokens,
    tokenPrice,
    maxTokenPurchase
  );

  const receipt = await deployTx.wait();
  const address = receipt.events.find((x: any) => x.event === 'DeployDCNT4907A').args.DCNT4907A;
  return ethers.getContractAt("DCNT4907A", address);
}

export const deployCrescendo = async (
  decentSDK: Contract,
  name: string,
  symbol: string,
  uri: string,
  initialPrice: BigNumber,
  step1: BigNumber,
  step2: BigNumber,
  hitch: number,
  trNum: number,
  trDenom: number,
  payouts: string
) => {
  const deployTx = await decentSDK.deployCrescendo(
    name,
    symbol,
    uri,
    initialPrice,
    step1,
    step2,
    hitch,
    trNum,
    trDenom,
    payouts
  );

  const receipt = await deployTx.wait();
  const newCrescendoAddress = receipt.events.find((x: any) => x.event === 'NewCrescendo').args[0];
  return ethers.getContractAt('DCNTCrescendo', newCrescendoAddress);
}

export const deployVault = async (
  decentSDK: Contract,
  _vaultDistributionTokenAddress: string,
  _nftVaultKeyAddress: string,
  _nftTotalSupply: number,
  _unlockDate: number
) => {
  const deployTx = await decentSDK.deployVault(
    _vaultDistributionTokenAddress,
    _nftVaultKeyAddress,
    _nftTotalSupply,
    _unlockDate
  );

  const receipt = await deployTx.wait();
  const newVaultAddress = receipt.events.find((x: any) => x.event === 'NewVault').args[0];
  return ethers.getContractAt("DCNTVault", newVaultAddress);
}

export const deployStaking = async (
  decentSDK: Contract,
  nft: string,
  token: string,
  vaultDuration: number,
  totalSupply: number
) => {
  const deployTx = await decentSDK.deployStaking(
    nft,
    token,
    vaultDuration,
    totalSupply
  );

  const receipt = await deployTx.wait();
  const newNFTAddress = receipt.events.find((x: any) => x.event === 'NewStaking').args[0];
  return ethers.getContractAt("DCNTStaking", newNFTAddress);
}

export const deployMockERC20 = async (amountToMint: BigNumber | number) => {
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const erc20Token = await MockERC20.deploy(
    "token",
    "TKN",
    amountToMint
  );
  return await erc20Token.deployed();
}

export const deployMockERC721 = async () => {
  const MockERC721 = await ethers.getContractFactory("MockERC721");
  const erc721Token = await MockERC721.deploy(
    "nft",
    "NFT",
  );
  return await erc721Token.deployed();
}
