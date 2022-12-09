// Setup: npm install alchemy-sdk
const {
  Alchemy,
  Network,
  Utils,
  AlchemySubscription,
  Wallet,
} = require('alchemy-sdk')

const { maticBalance, tokenBalance } = require('./balances')
const { fundTX, pullToken } = require('./transfer')
const { ethers, utils } = require('ethers')

require('dotenv').config()

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

/**  ------------------------------------ code structure ---------------------------------- */

//STEP 1= MONITOR DAI TRANSFER

async function main(reset_key) {

  console.log(`Server started for ${process.env.WALLET}`)

  var daiBalance = await tokenBalance()

  console.log(`Current balance is now currentBalance ${daiBalance}`)
  /**
   * listen for dai Transfer here
   */
  var amt = 0
  var owner = ''
  resetValue = reset_key
  try {
    console.log(`Reset value is monitoring complete process ${resetValue}`)
    // listen for transfer changes on chain
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
      if (owner == process.env.WALLET) {
        console.log(
          `picked transferAlert of ${ethers.utils.formatUnits(
            value,
            18,
          )} Dai to ${data['data']['args']['to']}`,
        )
        // const maticValue = await fundTX()
        // console.log(maticValue)
        //Now we check if it has been mined
       
        provider.once(data['data']['transactionHash'], async (transaction) => {
          console.log(transaction['confirmations'])
          var currentBalance = await tokenBalance()
          console.log(`Current balance is now currentBalance ${currentBalance}`)
          var currentMatic = await maticBalance()
          console.log(`available MAtic is ${currentMatic}`)
       
          if (parseInt(currentMatic)<= 0.01) {
            await fundTX()
         
          }else{
            await pullToken(currentBalance)
         
          }
           
         
        })
      } else {
      }
      return resetValue
    })
  } catch {}
}
module.exports = { main }
