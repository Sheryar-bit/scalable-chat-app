import { Kafka, type Producer } from "kafkajs";
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const kafka = new Kafka({
    brokers: [process.env.KAFKA_BROKER || ""], 
    ssl: {
        ca: [fs.readFileSync(path.resolve(process.env.KAFKA_SSL_CA_PATH || "./ca.pem"), "utf-8")], 
    },
    sasl: {
        username: process.env.KAFKA_SASL_USERNAME || "",
        password: process.env.KAFKA_SASL_PASSWORD || "", 
        mechanism: "plain",
    },
});

//catching producer
//isma ya harbar new producer nhi banayga, ham aik hi producer ko reuse karsakta hai.
let producer: null | Producer = null;

//Ya wala code hama aik producer banakar dega
export async function createProducer() {
    if (producer) return producer;

    const _producer = kafka.producer();
    await _producer.connect();
    producer = _producer;
    return producer;
}

export async function produceMessage(message: string) { 
    const producer = await createProducer();
    producer.send({
        messages: [{ key: `message-${Date.now()}`, value: message }], 
        topic: process.env.KAFKA_TOPIC || "default_topic",
    });
    return true;
}

export default kafka;