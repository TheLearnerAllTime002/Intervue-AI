import Redis from "ioredis"

if (process.env.NODE_ENV === "production" && !process.env.REDIS_URL) {
    throw new Error("REDIS_URL is required in production");
}

const redis = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6380")

redis.on("connect" , ()=>{
    console.log("redis connected")
})

export default redis
