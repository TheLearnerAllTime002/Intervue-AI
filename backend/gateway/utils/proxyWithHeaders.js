import proxy from "express-http-proxy"
import { proxyErrorHandler } from "./proxyErrorHandler.js"



export const proxyWithHeaders =(serviceUrl)=>{
    return proxy(
        serviceUrl,
        {
          parseReqBody: false,
          proxyErrorHandler,
          proxyReqOptDecorator:(proxyReqOpts, srcReq) =>{
            delete proxyReqOpts.headers["x-user-id"]
            delete proxyReqOpts.headers["x-session-id"]
            if(srcReq.user){
                proxyReqOpts.headers["x-user-id"]=srcReq.user.userId
            }
            if(srcReq.cookies?.session){
                proxyReqOpts.headers["x-session-id"] = srcReq.cookies.session
            }
            if (process.env.INTERNAL_SERVICE_SECRET) {
                proxyReqOpts.headers["x-gateway-secret"] = process.env.INTERNAL_SERVICE_SECRET
            }
            return proxyReqOpts

          } 
        }

    )
}
