import express from 'express'
import http from 'http';
import cors from 'cors'
import bodyParser from 'body-parser'
import { Server } from "socket.io";
import * as axios from 'axios'
import quizData from './quizData.js';

console.log(quizData)

const app = express()
const port = 3000
const webHookBase = 'https://388c-2603-8080-6f05-4682-9123-cce1-c412-985d.ngrok.io'
app.use(cors());

//Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:8080",
    methods: ["GET", "POST"]
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

server.listen(4000, () => {
  console.log('listening for sockets on *:4000');
});

// server-side
io.on("connection", (socket) => {
  console.log('initial socket ID: ', socket.id);
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
    'apikey': 'FTFdJRdVHpbHJ3NS5GPQ6MQFrX7mWXVa'
  }
}


// axios.post('https://api.zebedee.io/v0/charges', fundingData, options)
//     .then((res) => {
//         console.log(`Status: ${res.status}`);
//         console.log('Info: ', res.data);
//     }).catch((err) => {
//         console.error(err);
//     });

// axios.post('https://api.zebedee.io/v0/withdrawal-requests', withdrawalData, options)
//     .then((res) => {
//         console.log(`Status: ${res.status}`);
//         console.log('Info: ', res.data);
//     }).catch((err) => {
//         console.error(err);
//     });

app.get('/', (req, res) => {
  res.send('Hello World!')
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

app.post('/checkAnswer', (req, res) => {
  console.log('check answer body')
  // TODO: Send user ID for bakend
  const { questionId, choice } = req.body

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
    res.json({
      questionId,
      choice,
      result: 'correct'
    })

    // Payment Portion
    console.log('sent')
    const paymentData = {
      "gamertag": "aeschylus",
      "amount": "1500",
      "description": "testing liquidity"
    };

    axios.post('https://api.zebedee.io/v0/gamertag/send-payment', paymentData, options)
      .then((response) => {
        console.log(`Status: ${response.status}`);
        console.log('Info: ', response.data);
        res.json(response.data)
      }).catch((err) => {
        console.error(err);
        res.json(err)
      });
  }

})

const sendPayment = () => {

}