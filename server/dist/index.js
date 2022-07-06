"use strict";

var _express = _interopRequireDefault(require("express"));

var _http = _interopRequireDefault(require("http"));

var _cors = _interopRequireDefault(require("cors"));

var _bodyParser = _interopRequireDefault(require("body-parser"));

var _socket = require("socket.io");

var axios = _interopRequireWildcard(require("axios"));

var _quizData = _interopRequireDefault(require("./quizData.js"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

console.log(_quizData.default);
const app = (0, _express.default)();
const port = 3000;
const webHookBase = 'https://388c-2603-8080-6f05-4682-9123-cce1-c412-985d.ngrok.io';
app.use((0, _cors.default)()); //Here we are configuring express to use body-parser as middle-ware.

app.use(_bodyParser.default.urlencoded({
  extended: false
}));
app.use(_bodyParser.default.json());

const server = _http.default.createServer(app);

const io = new _socket.Server(server, {
  cors: {
    origin: "http://localhost:8080",
    methods: ["GET", "POST"]
  }
});
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
server.listen(4000, () => {
  console.log('listening for sockets on *:4000');
}); // server-side

io.on("connection", socket => {
  console.log('initial socket ID: ', socket.id);
  socket.join(socket.id);
});
const withdrawalData = {
  "expiresIn": 300,
  "amount": "120000",
  "description": "Testing withdrawals",
  "internalId": "blurblherp",
  "callbackUrl": "https://your-website.com/callback"
};
const options = {
  'headers': {
    'Content-Type': 'application/json',
    'apikey': 'FTFdJRdVHpbHJ3NS5GPQ6MQFrX7mWXVa'
  }
}; // axios.post('https://api.zebedee.io/v0/charges', fundingData, options)
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
  res.send('Hello World!');
});
app.post('/invoiceUpdates', (req, res) => {
  console.log(req.body);
  const {
    internalId,
    status
  } = req.body;
  io.to(internalId).emit("invoiceUpdated", req.body);
});
app.post('/paymentUpdates', (req, res) => {
  console.log(req.body);
  const {
    internalId,
    status
  } = req.body;
  io.to(internalId).emit("payoutUpdated", req.body);
});
app.post('/withdrawalRequestUpdates', (req, res) => {
  console.log(req.body);
  const {
    internalId,
    status
  } = req.body;
  io.to(internalId).emit("", req.body);
});
app.get('/questions', (req, res) => {
  res.json(_quizData.default.map(q => ({
    id: q.id,
    answers: q.answers,
    question: q.question
  })));
});
app.get('/getInvoice', async (req, res) => {
  console.log('Get Invoice Params');
  console.log(req.query);
  const {
    socketId
  } = req.query;
  const fundingData = {
    "expiresIn": 300,
    "amount": "100000",
    "description": "My Charge Description",
    "internalId": socketId,
    "callbackUrl": `${webHookBase}/invoiceUpdates`
  };
  axios.post('https://api.zebedee.io/v0/charges', fundingData, options).then(zres => res.json(zres.data)).catch(e => res.send(e));
});
app.post('/checkAnswer', (req, res) => {
  console.log('check answer body'); // TODO: Send user ID for bakend

  const {
    questionId,
    choice
  } = req.body;
  console.log(req.body);
  console.log('correct? ', _quizData.default[questionId].correctChoice === choice);

  if (_quizData.default[questionId].correctChoice !== choice) {
    res.json({
      questionId,
      choice,
      result: 'incorrect'
    });
    return;
  } else {
    res.json({
      questionId,
      choice,
      result: 'correct'
    }); // Payment Portion

    console.log('sent');
    const paymentData = {
      "gamertag": "aeschylus",
      "amount": "1500",
      "description": "testing liquidity"
    };
    axios.post('https://api.zebedee.io/v0/gamertag/send-payment', paymentData, options).then(response => {
      console.log(`Status: ${response.status}`);
      console.log('Info: ', response.data);
      res.json(response.data);
    }).catch(err => {
      console.error(err);
      res.json(err);
    });
  }
});

const sendPayment = () => {};