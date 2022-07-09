import { assign, createMachine } from 'xstate'
import { sendParent, sendUpdate } from 'xstate/lib/actions'
import isValidDomain from 'is-valid-domain'

const formInputMachine = createMachine({
  id: 'formInput',
  initial: 'active',
  context: {
    value: null
  },
  states: {
    active: {
      on: {
        DISABLE: 'disabled',
      },
      type: 'parallel',
      states: {
        focus: {
          initial: 'unfocused',
          states: {
            focused: {
              on: {
                BLUR: 'unfocused',
              },
            },
            unfocused: {
              on: {
                FOCUS: 'focused',
              },
            },
          },
        },
        validation: {
          initial: 'pending',
          on: {
            CHANGE: {
              target: '.pending',
              internal: false,
              actions: [
                'assignValueToContext',
                sendParent((c, e) => (
                  {
                    type: 'UPDATE_ADDRESS',
                    value: c.value
                  }
                ))
              ],
            },
          },
          states: {
            pending: {
              on: {
                REPORT_INVALID: {
                  target: 'invalid',
                  actions: 'assignReasonToErrorMessage'
                },
                REPORT_VALID: 'valid',
              },
              invoke: {
                src: 'validateField',
              },
            },
            valid: {
              entry: sendParent('INPUT_VALID')
            },
            invalid: {
              entry: sendParent('INPUT_INVALID')
            },
          },
        },
      },
    },
    disabled: {
      on: {
        ENABLE: 'active',
      },
    },
  },
  },
  {
    actions: {
      assignReasonToErrorMessage: assign((context, event) => {
        if (event.type !== 'REPORT_INVALID') return {};
        return {
          errorMessage: event.reason,
        };
      }),
      assignValueToContext: assign((context, event) => {
        console.log(event)
        if (event.type !== 'CHANGE') return {};
        return {
          value: event.value,
        };
      }),
    },
    services: {
      validateField: (context) => (send) => {
        const { value } = context
        const isValidEmailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(context.value)
        console.log('running validation')

        if (!isValidEmailFormat || context.value === '') {
          send({
            type: 'REPORT_INVALID',
            reason: 'Value cannot be empty',
          });
          return
        }

        const hasValidDomain = isValidDomain(value.split('@')[1])
        const isValidLnAddress = isValidEmailFormat && hasValidDomain

        if (isValidLnAddress) {
          send('REPORT_VALID');
          return
        }
      },
    },
  },
);

export default formInputMachine;