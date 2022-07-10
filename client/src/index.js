import './styles/main.scss'
import gold from './assets/gold.png'
import floor from './assets/floor.jpeg'
import satcoin from './assets/satcoin.gltf'
import celloSound from './assets/cello.mp3'
import lstrike from './assets/strike.mp3'
import distantThunder from './assets/distant_thunder.mp3'
import fail_strum from './assets/fail_strum.mp3'
import QRCode from 'qrcode'
import { Howl } from 'howler'
import {
  Vector3
} from 'three';
import { gsap, Circ, Sine } from 'gsap'
import { ScrollTrigger, Draggable, MotionPathPlugin } from "gsap/all";
import { createMachine, assign, interpret } from 'xstate'
import formInputMachine from './inputMachine'
import { inspect } from '@xstate/inspect'
import { io } from "socket.io-client"
import coinScene from './coinScene'
import envVars from './envVars'
import devEnvVars from './devEnvVars'
let apiBase
let socketPath

const randPosition = (max) => {
  const negative = Math.random() < 0.5 ? -1 : 1
  return Math.floor(Math.random() * max) * negative;
}

if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
  ({apiBase, socketPath} = devEnvVars)
  inspect({ iframe: false });
} else {
  ({apiBase, socketPath} = envVars)
}

const socket = io(apiBase, {
  path: socketPath
});
socket.on("connect_error", (err) => {
  console.log(`connect_error due to ${err.message}`);
});

// pre-load sounds
const strike = new Howl({
  src: ['strike.mp3']
})
const thunder = new Howl({
  src: ['distant_thunder.mp3']
})
const strum = new Howl({
  src: ['fail_strum.mp3']
})
const cello = new Howl({
  src: ['cello.mp3']
})

const element = document.getElementById('container')
const canvas = document.querySelector("canvas");

const resize = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resize()
window.addEventListener('resize', resize)

let questions;
let scene;

// layout Data
const stackLayout = Array(100).fill(0).map((c, i) => {// coin index
  let stackIndex
  let coinIndex
  let ry
  const inStack0 = i <= 19
  const inStack1 = i > 19 && i <= 39
  const inStack2 = i > 39 && i <= 59
  const inStack3 = i > 59 && i <= 79
  const inStack4 = i > 79

  const stackOffsets = [0, 19, 39, 59, 79]

  if (inStack0) {
    stackIndex = 0;
    coinIndex = i + 1;
    ry = (Math.PI * 2) / 8
  }
  if (inStack1) {
    stackIndex = 1;
    coinIndex = i - stackOffsets[1];
    ry = -(Math.PI * 2) / 8
  }
  if (inStack2) {
    stackIndex = 2;
    coinIndex = i - stackOffsets[2];
  }
  if (inStack3) {
    stackIndex = 3;
    coinIndex = i - stackOffsets[3];
  }
  if (inStack4) {
    stackIndex = 4;
    coinIndex = i - stackOffsets[4];
  }

  return {
    originalIndex: i,
    stackIndex,
    x: 3 + stackIndex * 2.5,
    y: ((coinIndex) * 0.4),
    z: 10,
  }
});

(async () => {
  const response = await fetch(`${apiBase}/questions`)
  questions = await response.json()
  console.log(questions)
  scene = coinScene()
})()

const renderWelcome = () => {
  const welcomeMessage = `
  <div id="welcome-message">
  <h1>Welcome.</h1>
  <h2>Satoshi Quiz lets you commit sats and earn them back in real time.</h2>
  <p>
  You will deposit 1000 satoshis (about $0.20 USD) using a lightning wallet of your choice. You'll then answer 5 questions. Every time to you get one right, 200 sats will be zapped back to your wallet instantly! This creates an incentive to focus and, most importantly, to finish the whole quiz!
  </p>
  <p>
  Any sats you don't win back will be mine to keep, but you can optionally withdraw them after the game is over.
  </p>
  <p>
  For this demo to work, you'll need a wallet with a lightning address. You can find one of those below (Zebedee is the one that works best with this demo):
  </p>
  <form>
  <label for="ln-address">Enter your Lightning Address to Start<label>
  <input type="email" id="ln-address" required>
  <input name="ln-address" type="submit" disabled>
  </form>
  </div>
  `
  element.insertAdjacentHTML(
    'afterbegin',
    welcomeMessage
  )
  element.querySelector('#ln-address')
    .addEventListener('input', (e) => {
      console.log(state.state.children.addressInput.state.value)
      state.state.children.addressInput.send(
        'CHANGE', { value: e.target.value }
      )
    })
  element.querySelector('form')
    .addEventListener('submit', (e) => {
      e.preventDefault()
      state.send('SUBMIT_ADDRESS')
    })
}

const enableSubmit = () => {
  element.querySelector('input[type="submit"]').disabled = false
}

const renderInputError = () => {
  element.querySelector('input[type="submit"]').disabled = true
}

const cleanUpWelcome = assign({
  questions: () => {
    document.querySelector('#welcome-message').remove()
    return questions
  }
})

const renderPaymentFlow = async () => {
  const payThing = document.createElement('h1')
  payThing.id = 'instructions'
  payThing.innerText = 'Scan with Zebedee'

  const response = await fetch(
    `${apiBase}/getInvoice?${new URLSearchParams({
      socketId: socket.id
    })}`,
    {
      // mode: 'no-cors',
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    }
  )

  const invoice = await response.json()
  const qr = document.createElement('img')
  qr.src = await QRCode.toDataURL(invoice.data.invoice.uri)
  qr.id = 'depositQR'
  
  const container = document.querySelector('#container')
  element.append(payThing)
  element.append(qr)

  // animation
  gsap
    .from("#instructions", {
      opacity: 0,
      duration: 0.6,
      ease: Circ.easeOut
    })
  gsap
    .from("img", {
      rotationY: 180,
      y: window.innerHeight/2,
      scale: 0.2,
      opacity: 0,
      duration: 1,
      ease: Circ.easeOut
    })
}

const cleanUpPaymentFlow = () => {
  document.querySelector('img').remove()
  document.querySelector('#instructions').remove()
}

const animatePaymentSuccess = () => {
  console.log('animating entries')

  // show message about what's happening
  // const instructions = document.createElement('h1')
  // instructions.id = 'payment-receipt'
  // instructions.innerText = "You've committed 100 sats"
  // element.append(instructions)

  const inst = `
    <h1 id="payment-receipt">You've committed 100 sats</h1>
  `
  element.insertAdjacentHTML('afterbegin',inst)
  gsap.fromTo(
    '#payment-receipt',
    { opacity: 0, y: 0, rotationX: 90, z: 100, scale: 2 },
    { opacity: 1, y: 0, rotationX: 0, z: 0, scale: 1 }
  )
  
  // Animation for loading coins
  const coinModels = scene.getCoins()
  const stackHeight = coinModels.length / 5
  const bolts = scene.getBolts()
  const finalTl = gsap.timeline()
  // make coins visible
  coinModels[0].children[0].children.forEach(c => c.material.opacity = 1)
  coinModels.forEach((coinModel, i) => {
    const pos = {
      z: 0,
      x: 0,
      y: 5,
      rx: 0,
      ry: 0,
      rz: 0,
    }

    const acc = {
      value: 0
    };

    finalTl.to(pos, {
      overwrite: 'auto',
      duration: 0.5,
      x: stackLayout[i].x + Math.random() * 0.1,
      y: stackLayout[i].y,
      z: stackLayout[i].z + Math.random() * 0.1,
      rx: 0,
      ry: 0,
      rz: 0,
      ease: 'linear',
      onUpdate: () => {
        coinModel.position.x = pos.x
        coinModel.position.y = pos.y
        coinModel.position.z = pos.z
        coinModel.rotation.x = pos.rx
        coinModel.rotation.y = pos.ry
        coinModel.rotation.z = pos.rz
      }
    }, 3 + i*0.05) // start at 3 seconds

    gsap.to(pos, {
      duration: 12,
      rx: Math.PI + Math.random() * 6,
      ry: Math.PI +  Math.random() * 6,
      rz: Math.PI +  Math.random() * 6,
      yoyo: false,
      ease: 'linear',
      onUpdate: () => {
        const dynamicAxis = i % 3
        const t = acc.value
        coinModel.rotation.x = pos.rx
        coinModel.rotation.y = pos.ry
        coinModel.rotation.z = pos.rz
      }
    })

    gsap.to(pos, {
      duration: 1,
      y: randPosition(5) + 7,
      x: randPosition(14),
      z: randPosition(10) + 5,
      ease: 'back',
      onUpdate: () => {
        coinModel.position.x = pos.x
        coinModel.position.y = pos.y
        coinModel.position.z = pos.z
      }
    })
  })

  // animate lightning bolts
  gsap.to({t: 0}, {
    t: 1,
    duration: 6,
    onStart: () => {
      strike.play()
      bolts.forEach((b) => {
        b.material.visible = true
      })
    },
    onUpdate: () => {
      bolts.forEach((bolt, i) => {
        bolt.geometry.rayParameters.destOffset.copy(
          coinModels[i * 5].position
        );
        bolt.geometry.update(scene.scene.userData.currentTime);
      })
    },
    onComplete: () => {
      bolts.forEach((b) => {
        b.material.visible = false
      })
    }
  })
}

const renderPlayingScreen = (c,e) => {
  // renderCoins(canvas)

  // Insert all questions ahead of time, but
  // hide them (css)
  c.questions.forEach(q => renderQuestion(q))

}

const enterPlayingSetup = () => {
  gsap.to(
    '#payment-receipt',
    { opacity: 0, rotationX: 90, y: -100 },
  )
}

const exitPlayingSetup = () => {
  gsap.to(
    '#payment-receipt',
    { opacity: 0, display: 'none', duration: 0.3 }
  )
}

const enterQuestioning = (c, e) => {
  gsap.fromTo(`#question-${c.currentQuestionId}`,
    { y: window.innerHeight / 2 },
    { opacity: 1, display: 'block', duration: 1, y:0 }
  )
}

const enterCheckingAnswer = (c,e) => {
  console.log('entering checking answer')
}

const assignAnswerHistory = assign({
  answerHistory: (c,e) => {
    const newHistory = c.answerHistory
    newHistory.push(e.data)
    return newHistory
  }
})

const assignQuestionId = assign({
  currentQuestionId: (c,e) => {
    return c.currentQuestionId + 1
  }
})

const enterIncorrectAnswer = (c,e) => {
  const { currentQuestionId } = c;
  console.log(currentQuestionId)
  strum.play()

  var shakeTl = gsap.timeline()

  shakeTl.fromTo(
    `#question-${currentQuestionId - 1}`,
    { x: "-=20" },
    {
      duration: 0.05,
      x: "+=40",
      repeat: 5,
      yoyo: true,
      ease: Sine.easeInOut,
      immediateRender: false
    }
  )

  gsap.to(
    `#question-${currentQuestionId-1 }`,
    { opacity: 0, display: 'none', duration: 0.3, delay: 2 }
  )
  const coins = scene.getCoins()
  const bolt = scene.getBolts()[0]
  const coinsToTake = stackLayout
    .filter(s => s.stackIndex === currentQuestionId - 1)
    .reverse()

  const takeTl = gsap.timeline()

  coinsToTake.forEach((c, i) => {
    const coinModel = coins[c.originalIndex]
    // coin destinations
    const pos = coinModel.position
    const rot = coinModel.rotation

    console.log('taking?')
    takeTl.to(coinModel.position, {
      overwrite: 'auto',
      duration: 3,
      ease: 'circ',
      x: coinModel.position.x,
      y: 30,
      z: -5,
      onUpdate: () => {
        coinModel.position.x = pos.x
        coinModel.position.y = pos.y
        coinModel.position.z = pos.z
      }
    }, i * 0.1) // offset by 100 ms
  })

  // animate lightning bolts
  gsap.to({t: 0}, {
    t: 1,
    duration: 6,
    onStart: () => {
      bolt.material.visible = true
      bolt.geometry.rayParameters.sourceOffset.copy(
        new Vector3( 3, 30, -5 )
      );
    },
    onUpdate: () => {
      bolt.geometry.rayParameters.destOffset.copy(
        coins[coinsToTake[coinsToTake.length - 1].originalIndex].position
      );
      bolt.geometry.update(scene.scene.userData.currentTime);
    },
    onComplete: () => {
      bolt.material.visible = false
    }
  })
}

const enterCorrectAnswer = (c, e) => {
  const { currentQuestionId } = c;
  cello.play()
  gsap.to(
    `#question-${currentQuestionId - 1}`,
    { opacity: 0, display: 'none', duration: 0.3 }
  )

  const coins = scene.getCoins()
  const bolts = scene.getBolts()
  const coinsToTake = stackLayout
    .filter(s => s.stackIndex === currentQuestionId - 1)
    .reverse()

  const takeTl = gsap.timeline()

  coinsToTake.forEach((c, i) => {
    const coinModel = coins[c.originalIndex]
    // coin destinations
    const pos = coinModel.position
    const rot = coinModel.rotation

    console.log('taking?')
    takeTl.to(pos, {
      overwrite: 'auto',
      duration: 2,
      ease: 'linear',
      x: 0,
      z: 30,
      y: 10,
      onUpdate: () => {
        coinModel.position.y = pos.y
        coinModel.rotation.x = Math.PI / 4
      }
    }, i * 0.2) // offset by 100 ms

    takeTl.to(rot, {
      overwrite: 'auto',
      duration: 5,
      ease: 'linear',
      x: Math.PI * 6,
      onUpdate: () => {
        coinModel.rotation.x = rot.x
      }
    },i * 0.2) // offset by 100 ms
  })

}

const checkAnswer = async (context, event) => {
  const { choice } = event
  const { currentQuestionId } = context
  console.log('checking question: ', currentQuestionId)
  let response = await fetch(
    `${apiBase}/checkAnswer`,
    {
      // mode: 'no-cors',
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        questionId: currentQuestionId,
        choice,
        socketId: socket.id,
        lnAddress: context.lnAddress
      })
    }
  )
  return response.json()
}

const renderQuestion = (q) => {
  const questionEl = document.createElement('div')
  questionEl.id = 'question-' + q.id
  questionEl.classList = 'questionText'

  const qText = document.createElement('h1')
  qText.append(q.question)

  const answerList = document.createElement('ol')
  answerList.type = 'a'

  q.answers.forEach((a,i) => {
    const item = document.createElement('li')
    const itemLink = document.createElement('a')
    itemLink.data = i
    itemLink.classList = 'answer'
    itemLink.innerText = a

    itemLink.onclick = async (e) => {
      state.send('CHOOSE', {choice: e.target.data})
    }
    item.append(itemLink)
    answerList.append(item)
  })

  questionEl.append(qText)
  questionEl.append(answerList)
  element.append(questionEl)
}

const updateScoreBoard = (c,e) => {
}

const renderScoreboard = (c,e) => {
  const scoreboard = document.createElement('div')
  scoreboard.id = 'scoreboard'

  const scoreText = document.createElement('h1')
  scoreText.innerText = `You answered ${c.answerHistory.reduce((sum, a)=>{
    return a.result === 'correct' ? sum + 1 : sum
  },0)} out of ${c.questions.length} correctly!`

  scoreboard.append(scoreText)

  element.append(scoreboard)
}

const appMachine = createMachine({
  id: 'promise',
  initial: 'welcome',
  context: {
    // coinScene: coinScene(canvas),
    currentQuestionId: 0,
    gamerTag: null,
    lnAddress: null,
    socketId: null,
    balance: 0,
    questions: null,
    answerHistory: [],
    timeElapsed: null
  },
  states: {
    welcome: {
      entry: renderWelcome,
      exit: cleanUpWelcome,
      on: {
        SUBMIT_ADDRESS: {
          target: 'loadingPayment',
          actions: assign({
            lnAddress: (c,e) => {
              return state.state.children.addressInput._state.context.value
            }
          })
        },
        INPUT_VALID: {
          actions: enableSubmit
        },
        INPUT_INVALID: {
          actions: renderInputError
        },
      },
      invoke: {
        id: 'addressInput',
        src: formInputMachine,
      },
    },
    loadingPayment: {
      entry: () => {
        renderPaymentFlow()
      },
      exit: () => {
        cleanUpPaymentFlow()
      },
      on: {
        SUCCESS: 'showingLoadup'
      }
    },
    showingLoadup: {
      entry: animatePaymentSuccess,
      after: {
        7000: 'playing'
      }
    },
    playing: {
      entry: renderPlayingScreen,
      initial: 'setup',
      states: {
        setup: {
          entry: () => {
            enterPlayingSetup()
          },
          exit: () => {
            exitPlayingSetup()
          },
          after: {
            2000: 'questioning'
          }
        },
        questioning: {
          entry: enterQuestioning,
          on: {
            CHOOSE: {
              target: 'checkingAnswer',
            }
          }
        },
        checkingAnswer: {
          entry: enterCheckingAnswer,
          invoke: {
            src: checkAnswer,
            onDone: [
              {
                target: 'correct',
                cond: (c, e) => {
                  return e.data.result === 'correct'
                },
                actions: [
                  assignAnswerHistory,
                  assignQuestionId
                ]
              },
              {
                target: 'incorrect',
                cond: (c,e) => {
                  return e.data.result === 'incorrect'
                },
                actions: [
                  assignAnswerHistory,
                  assignQuestionId
                ]
              }
            ],
            onError: {
              actions: assign({ error: (context, event) => event.data })
            }
          }
        },
        incorrect: {
          entry: enterIncorrectAnswer,
          after: {
            1000: [
              {
                target: '#scoreboard',
                cond: (c,e) => {
                  return c.currentQuestionId === c.questions.length
                }
              },
              {target: 'questioning'},
            ]
          }
        },
        correct: {
          entry: enterCorrectAnswer,
          after: {
            1000: [
              {
                target: '#scoreboard',
                cond: (c,e) => {
                  return c.currentQuestionId === c.questions.length
                }
              },
              {target: 'questioning'},
            ]
          }
        },
      }
    },
    scoreboard: {
      id: 'scoreboard',
      entry: renderScoreboard,
      type: 'final'
    },
  }
});

// Interpret the machine, and add a listener for whenever a transition occurs.
const state = interpret(appMachine, { devTools: true })

// Start the service
state.start();

// client-side
socket.on("connect", () => {
  console.log(socket.id);

  socket.on("disconnect", () => {
    console.log(socket.id);
  });
});

socket.on('invoiceUpdated', function (msg) {
  console.log('payment complete')
  console.log(msg)
  const { internalId, status } = msg
  if (status === 'completed') {
    state.send('SUCCESS')
  }
  if (status === 'expired') {
    console.log('INVOICE EXPIRED')
  }
});