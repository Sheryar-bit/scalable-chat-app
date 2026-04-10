import { Kafka, type Producer } from "kafkajs";
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const caPathCandidates = [
  process.env.KAFKA_SSL_CA_PATH,
  "./src/services/ca.pem",
  "./prisma/ca.pem",
  "./ca.pem",
].filter((p): p is string => Boolean(p));

const resolvedCaPath = caPathCandidates
  .map((candidate) => path.resolve(candidate))
  .find((resolvedPath) => fs.existsSync(resolvedPath));

if (!resolvedCaPath) {
  throw new Error(
    "Kafka CA certificate file not found. Set KAFKA_SSL_CA_PATH to a valid ca.pem path."
  );
}

const kafka = new Kafka({
    brokers: [process.env.KAFKA_BROKER || ""], 
    ssl: {
        ca: [fs.readFileSync(resolvedCaPath, "utf-8")], 
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