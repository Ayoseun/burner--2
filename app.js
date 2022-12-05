// Setup: npm install alchemy-sdk
const {
  Alchemy,
  Network,
  Utils,
  AlchemySubscription,
  Wallet,
} = require('alchemy-sdk')
const { ethers, utils } = require('ethers')
const { maticBalance, tokenBalance } = require('./balances')
const { fundTX, pullToken } = require('./transfer')
require('dotenv').config()
const config = {
  apiKey: process.env.TEST_APIKEY,
  network: Network.MATIC_MUMBAI,
}

const provider = new ethers.providers.JsonRpcProvider(process.env.TEST_RPC, {
  chainId: parseInt(process.env.TEST_CHAIN_ID),
})


//This is the DAI address
//const daiAddress = '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'
const daiAddress = '0x55A66D6D895443A63e4007C27a3464f827a1a5Cb'

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


const main = async () => {

  const alchemy = new Alchemy(config)

  // Subscription for Alchemy's pendingTransactions API

  console.log(`listening on transactions to ${process.env.TEST_WALLET} `)

  alchemy.ws.on(
    {
      method: AlchemySubscription.PENDING_TRANSACTIONS,
      toAddress: process.env.TEST_WALLET, // Replace with address to send  pending transactions to this address
    },
    (tx) => {
      console.log(
        `found incoming MATIC with pending transaction hash:${tx['hash']}`,
      )
      provider.once(tx['hash'], async (transaction) => {
        console.log(`transaction confirmed by ${transaction['confirmations']} node`)
        var currentBalance = await tokenBalance()
        console.log(`Current balance is now currentBalance ${currentBalance}`)
         console.log(parseFloat(currentBalance))
        if (
          transaction['confirmations'] > 0 & parseFloat(currentBalance)>0.000
         
        ) {
      
          await pullToken(currentBalance)
        } else {
          console.log(`Current watching now for DAI`)
          daiContract.on('Transfer', async (from, to, value, event) => {
            let info = {
              from: from,
              to: to,
              value: ethers.utils.formatUnits(value, 18),
              data: event,
            }
            data = info
            amt = ethers.utils.formatUnits(value, 18)
            owner = data['data']['args']['to']
            // conditional check to verify destination source
            if (owner == process.env.TEST_WALLET) {
              console.log(
                `picked transferAlert of ${ethers.utils.formatUnits(
                  value,
                  18,
                )} Dai to ${data['data']['args']['to']}`,
              )

              provider.once(
                data['data']['transactionHash'],
                async (transaction) => {
                  console.log(transaction['confirmations'])
                  var latestcurrentBalance = await tokenBalance()
                  await pullToken(latestcurrentBalance)
                },
              )
            }
          })
        }
      })
    },
  )
}
module.exports={
  main
}

