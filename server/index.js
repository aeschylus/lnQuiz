import express from 'express'
import http from 'http'
import cors from 'cors'
import bodyParser from 'body-parser'
import { Server } from "socket.io"
import * as axios from 'axios'
import quizData from './quizData.js'
import ngrok from 'ngrok'
import helmet from 'helmet'
require('log-timestamp')

const ZBD_KEY = process.env.ZBD_API_KEY;
const frontendOrigin = process.env.FRONTEND_ORIGIN;
const port = process.env.LN_QUIZ_PORT;

const app = express()

let webHookBase

if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
  async function connectNgrok() {
    webHookBase = await ngrok.connect();
  }
  connectNgrok()
} else {
  webHookBase = process.env.API_BASE
}

console.log('webhook Base')
console.log(webHookBase)

app.use(cors());

// disable cache for development
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})

// Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

const server = http.createServer(app);
const io = new Server(server)

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

// server-side
io.on("connection", (socket) => {
  console.log('initial socket ID: ', socket.id);
  socket.join(socket.id);
});
io.on("error", (err) => {
  console.log(err);
});

io.on("connect_error", (err) => {
  console.log('error', err);
  socket.join(socket.id);
});

const withdrawalData = {
  "expiresIn": 300,
  "amount": "120000",
  "description": "Testing withdrawals",
  "internalId": "blurblherp",
  "callbackUrl": "https://your-website.com/callback"
}

const options = {
  'headers': {
    'Content-Type': 'application/json',
    'apikey': ZBD_KEY
  }
}

// axios.post('https://api.zebedee.io/v0/charges', fundingData, options)
//     .then((res) => {
//         console.log(`Status: ${res.status}`);
//         console.log('Info: ', res.data);
//     }).catch((err) => {
//         console.error(err);
//     });

app.get('/', (req, res) => {
  res.send('API Base')
})

app.post('/invoiceUpdates', (req, res) => {
  console.log(req.body)
  const { internalId, status } = req.body
  io.to(internalId).emit("invoiceUpdated", req.body)
})

app.post('/paymentUpdates', (req, res) => {
  console.log(req.body)
  const { internalId, status } = req.body
  io.to(internalId).emit("payoutUpdated", req.body)
})

app.post('/withdrawalRequestUpdates', (req, res) => {
  console.log(req.body)
  const { internalId, status } = req.body
  io.to(internalId).emit("", req.body)
})

app.get('/questions', (req, res) => {
  res.json(quizData.map(q => ({
    id: q.id,
    answers: q.answers,
    question: q.question
  })))
})

app.get('/getInvoice', async (req, res) => {
  console.log('Get Invoice Params')
  console.log(req.query)
  const { socketId } = req.query

  const fundingData = {
    "expiresIn": 300,
    "amount": "100000",
    "description": "My Charge Description",
    "internalId": socketId,
    "callbackUrl": `${webHookBase}/invoiceUpdates`
  }

  axios
    .post(
      'https://api.zebedee.io/v0/charges',
      fundingData,
      options
    ).then(zres => res.json(zres.data))
    .catch(e => res.send(e))
})

app.get('/getWithdrawRequest', async (req, res) => {
  console.log('Get Invoice Params')
  console.log('Withdraw Request')
  console.log(req.query)
  const { socketId, lnAddress } = req.query

  const withdrawalData = {
    "expiresIn": 300,
    "amount": "12000",
    "description": "My Withdrawal Description",
    "internalId": "11af01d092444a317cb33faa6b8304b8",
    "callbackUrl": "https://your-website.com/callback"
  }

  axios.post('https://api.zebedee.io/v0/withdrawal-requests', withdrawalData, options)
    .then((res) => {
      console.log(`Status: ${res.status}`);
      console.log('Info: ', res.data);
    }).catch((err) => {
      console.error(err);
    });
})

app.post('/checkAnswer', (req, res) => {
  console.log('check answer body')
  // TODO: Send user ID for bakend
  const { questionId, choice, lnAddress, socketId } = req.body

  console.log(req.body)
  console.log('correct? ', quizData[questionId].correctChoice === choice)

  if (quizData[questionId].correctChoice !== choice) {
    res.json({
      questionId,
      choice,
      result: 'incorrect'
    })
    return
  } else {
    // Payment Portion
    console.log('sent')
    const paymentData = {
      "lnAddress": lnAddress,
      "amount": "1500",
      "description": "testing liquidity",
      "internalId": socketId
    };

    // axios.post('https://api.zebedee.io/v0/gamertag/send-payment', paymentData, options)

    axios.post('https://api.zebedee.io/v0/ln-address/send-payment', paymentData, options)
      .then((response) => {
        console.log(`Status: ${response.status}`);
        console.log('Info: ', response.data);
        res.json(response.data)
      }).catch((err) => {
        console.error(err);
        res.json(err)
      });

    res.json({
      questionId,
      choice,
      result: 'correct'
    })

  }

})

const sendPayment = () => {

}