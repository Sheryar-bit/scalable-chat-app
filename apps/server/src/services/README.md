# Socket Service

## Roman Urdu Explanation

Yeh file ek `SocketService` class define karti hai jo `socket.io` ka istemal karti hai real-time communication ke liye. Yeh service Redis ke saath integrate karti hai taake messages ko publish aur subscribe kiya ja sake.

### Code ka Flow:

1. **Redis Configuration:**
   - Redis ka configuration environment variables se liya jata hai.
   - `pub` aur `sub` Redis instances banaye gaye hain publish aur subscribe operations ke liye.

2. **SocketService Class:**
   - `SocketService` class ka ek private member `_io` hai jo `socket.io` ka server instance hai.
   - Constructor mein `socket.io` server initialize hota hai aur CORS settings set ki jati hain.

3. **initlistener Method:**
   - `initlistener` method socket listeners ko initialize karta hai.
   - Jab ek naya socket connect hota hai, toh `connect` event trigger hota hai.
   - `event:message` event ke liye ek listener set hota hai jo message ko Redis channel `MESSAGES` par publish karta hai.

### Code ka Example:

```javascript
const io = this.io;
io.on("connect", (socket) => {
    console.log(`New Socket Connected`, socket.id);
    socket.on("event:message", async ({ message }) => {
        console.log("New Message Received", message);
        await pub.publish("MESSAGES", JSON.stringify({ message }));
    });
});
```

Yeh listener har naye socket connection ke liye set hota hai aur messages ko Redis par publish karta hai.