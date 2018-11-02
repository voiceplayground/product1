/* eslint-disable  func-names */
/* eslint-disable  no-restricted-syntax */
/* eslint-disable  no-loop-func */
/* eslint-disable  consistent-return */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk-core');

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speechText = 'To calculate retirement readiness, you will need your age, your current balance, the amount you would like to save, and the amount you would like to earn in retirement. Do you want to continue?';

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
        console.log('in InProgressIntent');

        // check any filled slots for invalid values. If found, elicit that slot again
        const currentIntent = handlerInput.requestEnvelope.request.intent;
        let prompt = '';

        for (const slotName of Object.keys(handlerInput.requestEnvelope.request.intent.slots)) {
            const currentSlot = currentIntent.slots[slotName];
            if ((currentSlot.value && currentSlot.value === '?') ||
                (currentSlot.resolutions &&
                currentSlot.resolutions.resolutionsPerAuthority &&
                currentSlot.resolutions.resolutionsPerAuthority[0] &&
                currentSlot.resolutions.resolutionsPerAuthority[0].status.code === 'ER_SUCCESS_NO_MATCH')) {

                prompt = "Sorry I didn't understand that. " + reprompts[currentSlot.name];
                return handlerInput.responseBuilder
                    .speak(prompt)
                    .reprompt(prompt)
                    .addElicitSlotDirective(currentSlot.name)
                    .getResponse();
            }
        }

        return handlerInput.responseBuilder
            .addDelegateDirective(currentIntent)
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

        const gap = getGap(slotValues.currentBalance.resolved, slotValues.investmentProfile.resolved, slotValues.age.resolved, slotValues.savingsPerYear.resolved, slotValues.desiredIncome.resolved);

        const speechOutput = (gap) => {
            if(gap < 0.0) {
                return `You have a deficit of ${gap} dollars. Consider contributing more to your retirement account.`;
            } else if(gap === 0.0) {
                return `Congratulations! You are on track.`;
            } else {
                return `Congratulations! You have a surplus of ${gap} dollars.`;
            }
        };

        return handlerInput.responseBuilder
            .speak(speechOutput(gap))
            .getResponse();
    },
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speechText = 'To calculate your retirement readiness, say "Retirement Readiness" and provide a few details about your goals. Do you want to calculate your retirement readiness?';

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .withSimpleCard('Retirement Readiness', speechText)
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
            //.withSimpleCard('Hello World', speechText)
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

const requiredSlots = [
    'age',
    'currentBalance',
    'savingsPerYear',
    'desiredIncome',
    'investmentProfile'
];

// this is not good because the slot names are hard-coded; fix this in the future.
const reprompts = {
    'age': 'How old are you?',
    'currentBalance': 'What is your current account balance?',
    'savingsPerYear': 'How much do you invest per year?',
    'desiredIncome': 'What is your desired monthly retirement income before inflation?',
    'investmentProfile': 'Is your investment profile conservative, balanced, or aggressive?'
};

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

const getGap = (currentBalance, investmentProfile, age, savingsPerYear, desiredIncome) => {
    const periods = 65 - age;

    const profiles = {
        "aggressive": .07,
        "balanced": .05,
        "conservative": .04
    };

    const rate = profiles[investmentProfile];

    const futureValue = (currentBalance * (((1 + rate)*.97) ** periods)) + (savingsPerYear * (((((1 + rate) * .97) * periods) - 1) / rate));

    // Simple drawdown of 3%, balance doesn't change.
    const projectedIncome = (futureValue * .03) / 12;

    // Desired income adjusted for 3% inflation.
    const adjustedDesiredIncome = desiredIncome * (1.03 ** periods);

    // Desired - actual. Surplus if negative.
    const gap = adjustedDesiredIncome - projectedIncome;

    return Math.round(gap * 100) / 100;
};

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
