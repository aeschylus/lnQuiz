"use strict";

var _express = _interopRequireDefault(require("express"));

var _http = _interopRequireDefault(require("http"));

var _cors = _interopRequireDefault(require("cors"));

var _bodyParser = _interopRequireDefault(require("body-parser"));

var _socket = require("socket.io");

var axios = _interopRequireWildcard(require("axios"));

var _quizData = _interopRequireDefault(require("./quizData.js"));

var _ngrok = _interopRequireDefault(require("ngrok"));

var _helmet = _interopRequireDefault(require("helmet"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

require('log-timestamp');

console.log(_quizData.default);
const ZBD_KEY = process.env.ZBD_API_KEY;
const frontendOrigin = process.env.FRONTEND_ORIGIN;
const port = process.env.LN_QUIZ_PORT;
const sioPort = process.env.LN_QUIZ_SOCKET_PORT;
const app = (0, _express.default)();
let webHookBase;

async function connectNgrok() {
  webHookBase = await _ngrok.default.connect();
}

connectNgrok(); // const webHookBase = 'https://388c-2603-8080-6f05-4682-9123-cce1-c412-985d.ngrok.io'

app.use((0, _cors.default)()); // disable cache for development

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
}); //Here we are configuring express to use body-parser as middle-ware.

app.use(_bodyParser.default.urlencoded({
  extended: false
}));
app.use(_bodyParser.default.json());

const server = _http.default.createServer(app);

const io = new _socket.Server(server, {
  cors: {
    origin: frontendOrigin,
    methods: ["GET", "POST"]
  }
});
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
server.listen(sioPort, () => {
  console.log(`listening for sockets on *:${sioPort}`);
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
    'apikey': ZBD_KEY
  }
}; // axios.post('https://api.zebedee.io/v0/charges', fundingData, options)
//     .then((res) => {
//         console.log(`Status: ${res.status}`);
//         console.log('Info: ', res.data);
//     }).catch((err) => {
//         console.error(err);
//     });

app.get('/', (req, res) => {
  res.send('LN Quiz API Base, really. It ought to be updating');
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
app.get('/getWithdrawRequest', async (req, res) => {
  console.log('Get Invoice Params');
  console.log('Withdraw Request');
  console.log(req.query);
  const {
    socketId,
    lnAddress
  } = req.query;
  const withdrawalData = {
    "expiresIn": 300,
    "amount": "12000",
    "description": "My Withdrawal Description",
    "internalId": "11af01d092444a317cb33faa6b8304b8",
    "callbackUrl": "https://your-website.com/callback"
  };
  axios.post('https://api.zebedee.io/v0/withdrawal-requests', withdrawalData, options).then(res => {
    console.log(`Status: ${res.status}`);
    console.log('Info: ', res.data);
  }).catch(err => {
    console.error(err);
  });
});
app.post('/checkAnswer', (req, res) => {
  console.log('check answer body'); // TODO: Send user ID for bakend

  const {
    questionId,
    choice,
    lnAddress,
    socketId
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
    // Payment Portion
    console.log('sent');
    const paymentData = {
      "lnAddress": lnAddress,
      "amount": "1500",
      "description": "testing liquidity",
      "internalId": socketId
    }; // axios.post('https://api.zebedee.io/v0/gamertag/send-payment', paymentData, options)

    axios.post('https://api.zebedee.io/v0/ln-address/send-payment', paymentData, options).then(response => {
      console.log(`Status: ${response.status}`);
      console.log('Info: ', response.data);
      res.json(response.data);
    }).catch(err => {
      console.error(err);
      res.json(err);
    });
    res.json({
      questionId,
      choice,
      result: 'correct'
    });
  }
});

const sendPayment = () => {};