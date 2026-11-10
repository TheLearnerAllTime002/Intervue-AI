import redis from "../../shared/redis/redis.js"



export const isAuth = async (req,res,next) => {
    try {
        const sessionId = req.cookies?.session

        if(!sessionId){
            return res.status(401).json({message:"Unauthorized"})
        }

        const session =await redis.get(`session:${sessionId}`)

        if(!session){
            return res.status(401).json({message:"Session Expired"})
        }

        req.user = JSON.parse(session);
        // Guard against corrupted sessions where userId was serialised as an object
        if (!req.user?.userId || typeof req.user.userId !== "string") {
            await redis.del(`session:${sessionId}`)
            return res.status(401).json({ message: "Session invalid. Please sign in again." })
        }

        next();

    } catch (error) {
         return res.status(500).json({message:error.message});
    }
}