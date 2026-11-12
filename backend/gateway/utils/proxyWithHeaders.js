import proxy from "express-http-proxy"
import { proxyErrorHandler } from "./proxyErrorHandler.js"
import { getSessionId } from "../../shared/sessionConfig.js"



export const proxyWithHeaders =(serviceUrl)=>{
    return proxy(
        serviceUrl,
        {
          parseReqBody: false,
          proxyErrorHandler,
          proxyReqOptDecorator:(proxyReqOpts, srcReq) =>{
            proxyReqOpts.headers["x-request-id"] = srcReq.requestId || "unknown"
            delete proxyReqOpts.headers["x-user-id"]
            delete proxyReqOpts.headers["x-session-id"]
            if(srcReq.user){
                proxyReqOpts.headers["x-user-id"]=srcReq.user.userId
            }
            const sessionId = getSessionId(srcReq.cookies)
            if(sessionId){
                proxyReqOpts.headers["x-session-id"] = sessionId
            }
            if (process.env.INTERNAL_SERVICE_SECRET) proxyReqOpts.headers["x-gateway-secret"] = process.env.INTERNAL_SERVICE_SECRET
            return proxyReqOpts

          },
          userResDecorator: (proxyRes, proxyResData, userReq) => {
            if (proxyRes.statusCode === 401 || proxyRes.statusCode >= 500) {
              let message;
              try {
                message = JSON.parse(proxyResData.toString("utf8"))?.message;
              } catch {
                message = undefined;
              }
              console.warn(JSON.stringify({
                event: proxyRes.statusCode === 401 ? "DOWNSTREAM_AUTH_FAILURE" : "DOWNSTREAM_SERVICE_FAILURE",
                requestId: userReq.requestId || "unknown",
                service: new URL(serviceUrl).hostname,
                endpoint: userReq.path || userReq.url?.split("?")[0],
                status: proxyRes.statusCode,
                message: typeof message === "string" ? message.slice(0, 200) : undefined,
              }))
            }
            return proxyResData
          },
        }

    )
}
