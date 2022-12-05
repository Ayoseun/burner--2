
const { spawn } = require('child_process');

// Setup: npm install alchemy-sdk
const {
  Alchemy,
  Network,
  Utils,
  AlchemySubscription,
  Wallet,
} = require('alchemy-sdk')
const { ethers, utils } = require('ethers')
const { getBalance } = require('multichain-crypto-wallet')
require('dotenv').config()
const multichainWallet = require('multichain-crypto-wallet')

//this is the configuration for alchemy alchemy API and network
const config = {
  apiKey: process.env.APIKEY,
  network: Network.MATIC_MAINNET,
}
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC, {
  chainId: parseInt(process.env.CHAIN_ID),
})

//Get Alchemy object
const alchemy = new Alchemy(config)

//This is the DAI address
const daiAddress = '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'
//const daiAddress = '0x55A66D6D895443A63e4007C27a3464f827a1a5Cb'

// The ERC-20 Contract ABI, which is a common contract interface
// for tokens (this is the Human-Readable ABI format)
const daiAbi = [
  // Some details about the token
  'function name() view returns (string)',
  'function symbol() view returns (string)',

  // Get the account balance
  'function balanceOf(address) view returns (uint)',

  // Send some of your tokens to someone else
  'function transfer(address to, uint amount)',

  // An event triggered whenever anyone transfers to someone else
  'event Transfer(address indexed from, address indexed to, uint amount)',
]

const daiContract = new ethers.Contract(daiAddress, daiAbi, provider)

let signer = new Wallet(process.env.PRIVATE_KEY)


//get Dai balance
const tokenBalance = async () => {
    // Get the balance of an address
    balance = await daiContract.balanceOf(process.env.WALLET)
    // { BigNumber: "6026189439794538201631" }
  
    // Format the DAI for displaying to the user
    var bal = ethers.utils.formatUnits(balance, 18)
  
    return bal
  }
  
  //get Dai balance
  const maticBalance = async () => {
    let balance = await alchemy.core.getBalance(process.env.WALLET, 'latest')
  
    balance = Utils.formatEther(balance)
  
    return balance
  }

  module.exports={
maticBalance,
tokenBalance
  }