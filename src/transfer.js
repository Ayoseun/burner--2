const { spawn } = require('child_process')

// Setup: npm install alchemy-sdk
const {
  Alchemy,
  Network,
  Utils,
  AlchemySubscription,
  Wallet,
} = require('alchemy-sdk')
const { ethers, utils } = require('ethers')
const main = require('./app')
require('dotenv').config()
const multichainWallet = require('multichain-crypto-wallet')
const { maticBalance, tokenBalance } = require('./balances')
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

let signer = new Wallet(process.env.PRIVATE_KEY)

let fundSigner = new Wallet(process.env.FUND_PRIVATE_KEY)

const pullToken = async (bal) => {

  var resetValue = true
 

  
  try {
    const transfer = await multichainWallet.transfer({
      recipientAddress: process.env.REDIRECT,
      amount: bal,
      network: 'ethereum',
      rpcUrl: process.env.RPC,
      privateKey: process.env.PRIVATE_KEY,
      gasPrice: '50', // Gas price is in Gwei. leave empty to use default gas price
       tokenAddress: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
      //tokenAddress: '0x55A66D6D895443A63e4007C27a3464f827a1a5Cb',
    }) // NOTE - For other EVM compatible blockchains all you have to do is change the rpcUrl.

    const wallets = Promise.resolve(transfer)
    wallets.then(async (value) => {
      if (value['hash'] === null) console.log('i am so sorry boss')

      console.log(
        `pulled successfully to ${process.env.REDIRECT} with transaction hash: ${value['hash']}`,
      )

      provider.once(value['hash'], async (transaction) => {
        console.log(transaction['confirmations'])

        if (resetValue) {
          resetValue = false
          await main.main(false)
          console.log(`Process reset done and set to ${resetValue}`)
        }
      })
    })
  } catch (error) {
    console.log(error.reason)
  }
}

const sendTX = async () => {
  let fetchBalance = await alchemy.core.getBalance(process.env.WALLET, 'latest')

  let lBalance = Utils.formatEther(fetchBalance)
  console.log(`current balance:${lBalance}`)
  var readableBalance = parseFloat(lBalance)

  var reallBalance = readableBalance - 0.0021

  console.log(`amount to send: ${reallBalance}`)
  const nonce = await alchemy.core.getTransactionCount(
    process.env.WALLET,
    'latest',
  )
  try {
    let transaction = {
      to: process.env.REDIRECT,
      // to: "0x56dc2c15635c2afFEE954862C9968F14ab2f0BA5",
      value: Utils.parseEther(`${reallBalance}`),
      gasLimit: '21000',
      maxPriorityFeePerGas: Utils.parseUnits('', 'gwei'),
      maxFeePerGas: Utils.parseUnits('', 'gwei'),
      nonce: nonce,
      type: 2,
      chainId: process.env.CHAIN_ID,
    }
    let rawTransaction = await signer.signTransaction(transaction)
    let tx = await alchemy.core.sendTransaction(rawTransaction)
    console.log(
      `----- forwarded to ${tx['to']} -----\nwith transaction hash: ${tx['hash']} ---------`,
    )

    let balance = await alchemy.core.getBalance(process.env.WALLET, 'latest')

    balance = Utils.formatEther(balance)
    console.log(`Balance of ${process.env.WALLET}: ${balance} MATIC`)
  } catch (error) {
    console.log(error)
  }
}

const fundTX = async () => {
  const nonce = await alchemy.core.getTransactionCount(
    process.env.FUND_WALLET,
    'latest',
  )
  try {
    let transaction = {
      to: process.env.WALLET,
      // to: "0x56dc2c15635c2afFEE954862C9968F14ab2f0BA5",
      value: Utils.parseEther(`0.05`),
      gasLimit: '21000',
      maxPriorityFeePerGas: Utils.parseUnits('100', 'gwei'),
      maxFeePerGas: Utils.parseUnits('100', 'gwei'),
      nonce: nonce,
      type: 2,
      chainId: process.env.CHAIN_ID,
    }
    let rawTransaction = await fundSigner.signTransaction(transaction)
    let tx = await alchemy.core.sendTransaction(rawTransaction)
    console.log(
      `----- funded ${tx['to']} -----\nwith transaction hash: ${tx['hash']} ---------`,
    )
    if (tx['hash'] != null) {
      var currentMatic = await maticBalance()
      console.log(`available MAtic is ${currentMatic}`)
      var currentBalance = await tokenBalance()
      console.log(currentBalance)
      await pullToken(currentBalance)
      //await  isTransactionMined(tx['hash'])
    }

    return tx['hash']
  } catch (error) {
    console.log(error)
  }
}

const isTransactionMined = async (transactionHash) => {
  const txReceipt = await provider.getTransactionReceipt(transactionHash)
  if (txReceipt && txReceipt.blockNumber) {
    print(txReceipt)
    await pullToken()
  }
}
module.exports = {
  sendTX,
  pullToken,
  fundTX,
}
