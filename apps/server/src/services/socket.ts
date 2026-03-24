import { Server } from "socket.io";
import { Redis } from "ioredis";

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

        sub.subscribe("MESSAGES");
        sub.on("message", (channel, message) => {
            console.log("New Message from Redis", channel, message);
            const { message: msg } = JSON.parse(message) as { message: string };
            io.emit("message", JSON.stringify({ message: msg }));
        });
    }

        get io() {
            return this._io
        }
    }

    export default SocketService