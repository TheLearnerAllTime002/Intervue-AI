import fs from "fs"
import path from "path"
import { randomUUID } from "crypto"
import multer from "multer"
const uploadPath = "./uploads"

fs.mkdirSync(uploadPath, { recursive: true })

const storage = multer.diskStorage({
    destination:(req,file,cb)=>{
      cb(null , uploadPath)
    },
    filename:(req,file,cb)=>{
        cb(null , `${Date.now()}-${randomUUID()}.pdf`)
    }
})


const fileFilter = (req,file,cb)=>{
    if(file.mimetype === "application/pdf" && path.extname(file.originalname).toLowerCase() === ".pdf"){
        cb(null , true)
    }else{
        cb(new Error("Only PDF files are allowed") , false)
    }
}

export const upload = multer({
    storage,
    fileFilter,
    limits:{
        fileSize: 20 * 1024 * 1024,
        files: 1,
        fields: 0,
    }
})

export const handleResumeUpload = (req, res, next) => {
    upload.single("resume")(req, res, (error) => {
        if (!error) return next()
        if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({ success: false, message: "The PDF is too large. The maximum size is 20 MB." })
        }
        const message = error instanceof multer.MulterError
            ? "Upload one PDF file without extra form fields."
            : error.message || "The PDF could not be uploaded."
        return res.status(400).json({ success: false, message })
    })
}
