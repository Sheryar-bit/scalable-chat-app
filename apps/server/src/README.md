# Server Initialization

## Roman Urdu Explanation

Yeh file server ko initialize karti hai aur `SocketService` ko integrate karti hai taake WebSocket communication enable ho.

### Code ka Flow:

1. **HTTP Server:**
   - `http` module ka istemal karke ek HTTP server banaya gaya hai.
   - Server ka port environment variable `PORT` se liya jata hai, agar yeh set na ho toh default port `8000` use hota hai.

2. **SocketService Initialization:**
   - `SocketService` ka ek instance banaya jata hai.
   - `socketService.io.attach(httpServer)` ke zariye `socket.io` ko HTTP server ke saath attach kiya jata hai.

3. **Server Listening:**
   - HTTP server ko `listen` method ke zariye start kiya jata hai aur console par ek message print hota hai jo port number batata hai.

4. **Socket Listeners:**
   - `socketService.initlistener()` method ko call karke socket listeners initialize kiye jate hain.

### Code ka Example:

```javascript
const httpServer = http.createServer();
const PORT = process.env.PORT ? process.env.PORT : 8000;

socketService.io.attach(httpServer);

httpServer.listen(PORT, () =>
    console.log(`HTTP Server started at PORT:${PORT}`)
);

socketService.initlistener();
```

Yeh code HTTP server ko start karta hai aur `SocketService` ke listeners ko initialize karta hai.