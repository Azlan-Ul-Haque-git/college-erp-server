import twilio from "twilio";
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
export const sendSMS = async (to, body) => { await client.messages.create({ body, from: process.env.TWILIO_PHONE, to }); };
