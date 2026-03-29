import { Server } from "socket.io";
import { Redis } from "ioredis";
import { produceMessage } from "./kafka.js"
import prismaClient from "./prisma.js";

// const redis = new Redis()

const redisConfig = {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
};

const pub = new Redis(redisConfig);
const sub = new Redis(redisConfig);

class SocketService {
    
        private _io: Server;

        constructor() {
            console.log("Init Socket Service...")
            this._io=new Server({
                cors: {
                    allowedHeaders: ['*'],
                    origin: '*'
                }
            })
        }

        public initlistener() {
            // const io = this.io
            // io.on("connected", (socket) => {
            //     console.log(`New Socket Connetion`, socket.io)

            //     socket.on('evemt:message', async ({message}): {message: string})=> {
            //         console.log('New Message Received')
            //     }
            // })
             const io = this.io;
             console.log("Init Socket Listeners...");

            io.on("connect", (socket) => {
            console.log(`New Socket Connected`, socket.id);
            socket.on("event:message", async ({ message }: { message: string }) => {
            console.log("New Message Rec.", message);
        //  publish this message to redis
         await pub.publish("MESSAGES", JSON.stringify({ message }));
      });
    });

        //Hamna kya kiya, jou bhi message aya hamaraa pass redis sa hamna usko sab clients kou dediya aur uska baad hamna us msg kou kafka ka andar daldiya.
        sub.subscribe("MESSAGES");
        sub.on("message", async (channel, message) => {
            console.log("New Message from Redis", channel, message);
            const { message: msg } = JSON.parse(message) as { message: string };
            io.emit("message", JSON.stringify({ message: msg }));
            //Now ab ham apna message kou apna prisma ma nhi rakhna hai

            // await prismaClient.message.create({
            //     data: {
            //         text: message,
            //     },
            // })

            //ab Hum message kou produce karaga
            await produceMessage(message)
            console.log('Message Produced to Kafka Broker')
        });
    }

        get io() {
            return this._io
        }
    }

    export default SocketService