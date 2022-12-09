const func = require('./src/app')
//this reset boolean resets the main process once an execution is run completely



const express = require('express')

const app = express()

app.use(express.json())
var reset = true
app.listen(process.env.PORT || 3004, () => {

  console.log(`Server Started at ${process.env.PORT} `)
  //Reset key is passed to main
  func.main(reset)
})

module.exports = {
  reset,
}
