/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk-core');

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speechText = 'Hello. I calculate retirement savings gaps!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  },
};

const InProgressIntent = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest'
      && request.intent.name === 'RetirementReadinessIntent'
      && request.dialogState !== 'COMPLETED';
  },
  handle(handlerInput) {
    const currentIntent = handlerInput.requestEnvelope.request.intent;
    // let prompt = '';

    // for (const slotName of Object.keys(handlerInput.requestEnvelope.request.intent.slots)) {
    //   const currentSlot = currentIntent.slots[slotName];
    //   if (currentSlot.confirmationStatus !== 'CONFIRMED'
    //             && currentSlot.resolutions
    //             && currentSlot.resolutions.resolutionsPerAuthority[0]) {
    //     if (currentSlot.resolutions.resolutionsPerAuthority[0].status.code === 'ER_SUCCESS_MATCH') {
    //       if (currentSlot.resolutions.resolutionsPerAuthority[0].values.length > 1) {
    //         prompt = 'Which would you like';
    //         const size = currentSlot.resolutions.resolutionsPerAuthority[0].values.length;

    //         currentSlot.resolutions.resolutionsPerAuthority[0].values
    //           .forEach((element, index) => {
    //             prompt += ` ${(index === size - 1) ? ' or' : ' '} ${element.value.name}`;
    //           });

    //         prompt += '?';

    //         return handlerInput.responseBuilder
    //           .speak(prompt)
    //           .reprompt(prompt)
    //           .addElicitSlotDirective(currentSlot.name)
    //           .getResponse();
    //       }
    //     } else if (currentSlot.resolutions.resolutionsPerAuthority[0].status.code === 'ER_SUCCESS_NO_MATCH') {
    //       if (requiredSlots.indexOf(currentSlot.name) > -1) {
    //         prompt = `What ${currentSlot.name} are you looking for`;

    //         return handlerInput.responseBuilder
    //           .speak(prompt)
    //           .reprompt(prompt)
    //           .addElicitSlotDirective(currentSlot.name)
    //           .getResponse();
    //       }
    //     }
    //   }
    // }

    // return handlerInput.responseBuilder
    //   .addDelegateDirective(currentIntent)
    //   .getResponse();

    return handlerInput.responseBuilder
      .speak(prompt)
      .reprompt(prompt)
      .addElicitSlotDirective(currentSlot.name)
      .getResponse();
  },
};

const CompletedIntent = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest'
      && request.intent.name === 'RetirementReadinessIntent'
      && request.dialogState === 'COMPLETED';
  },
  handle(handlerInput) {
    const filledSlots = handlerInput.requestEnvelope.request.intent.slots;

    const slotValues = getSlotValues(filledSlots);

    const gap = getGap(slotvalues.currentBalance.resolved, slotvalues.investmentProfile.resolved, slotvalue.age.resolved, slotvalue.savingsPerYear.resolved, slotvalue.desiredIncome.resolved);

    const speechOutput = `Your gap is ${gap} dollars`; // account for surplus senario

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .getResponse();
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = 'I calculate retirement!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speechText = 'Goodbye!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Please say again.')
      .reprompt('Sorry, I can\'t understand the command. Please say again.')
      .getResponse();
  },
};

const skillBuilder = Alexa.SkillBuilders.custom();

function getSlotValues(filledSlots) {
  const slotValues = {};

  console.log(`The filled slots: ${JSON.stringify(filledSlots)}`);
  Object.keys(filledSlots).forEach((item) => {
    const name = filledSlots[item].name;

    if (filledSlots[item] &&
      filledSlots[item].resolutions &&
      filledSlots[item].resolutions.resolutionsPerAuthority[0] &&
      filledSlots[item].resolutions.resolutionsPerAuthority[0].status &&
      filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
      switch (filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
        case 'ER_SUCCESS_MATCH':
          slotValues[name] = {
            synonym: filledSlots[item].value,
            resolved: filledSlots[item].resolutions.resolutionsPerAuthority[0].values[0].value.name,
            isValidated: true,
          };
          break;
        case 'ER_SUCCESS_NO_MATCH':
          slotValues[name] = {
            synonym: filledSlots[item].value,
            resolved: filledSlots[item].value,
            isValidated: false,
          };
          break;
        default:
          break;
      }
    } else {
      slotValues[name] = {
        synonym: filledSlots[item].value,
        resolved: filledSlots[item].value,
        isValidated: false,
      };
    }
  }, this);

  return slotValues;
}

function getGap(currentBalance, investmentProfile, age, savingsPerYear, desiredIncome) {
    
    var fv, rate, periods, gap

    // compound annually
    periods = 65 - age

    switch (investmentProfile) {
        case "aggressive":
            rate = .07
        case "balanced":
            rate = .05
        case "conservative":
            rate = .04
        default: 
            rate = .04
    }

    fv = (currentBalance * ((1 + rate)**periods)) + (savingsPerYear*(((((1+rate)*.97)periods)-1)/rate))

    desiredIncome = desiredIncome * (1.03**periods) // inflation
    gap = desiredIncome - fv

    return Math.round(gap*100)/100 
}

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    InProgressIntent,
    CompletedIntent,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
