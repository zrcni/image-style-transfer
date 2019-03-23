require("./setupEnvironment")
const http = require("http")
const express = require("express")
const cors = require("cors")
const formidable = require("express-formidable")
const bodyParser = require("body-parser")

const { stylizeImage, uploadImage } = require("./models/style")
const { createGraphQLServer } = require("./graphql")
const { pubsub } = require("./graphql/pubsub")
const events = require('./events')

const PORT = 3001

const app = express()

app.use(cors())
app.use("/image", bodyParser.urlencoded({ extended: false }))
app.use(
  "/image",
  formidable({
    encoding: "utf-8",
    uploadDir: "./temp",
    multiples: false
  })
)

// todo move to graphql via upload link
app.post("/image", async (req, res) => {
  const { files, fields } = req
  const { modelId } = fields

  const { file } = files
  const filePath = file.path
  const fileName = file.name

  res.status(200).send("ok")

  pubsub.publish("styleTransferEvent", {
    styleTransferEvent: {
      name: events.STYLIZE_STARTED,
      message: "Image stylizing started"
    }
  })

  try {
    const result = await stylizeImage(file, modelId)
    if (!result.success) {
      throw new Error(result.err)
    }

    pubsub.publish("styleTransferEvent", {
      styleTransferEvent: {
        name: events.STYLIZE_SUCCEEDED,
        message: "Image stylizing succeeded"
      }
    })    

    const imageURL = await uploadImage(result.file.name, result.file.path)

    pubsub.publish("styleTransferEvent", {
      styleTransferEvent: {
        name: events.UPLOAD_SUCCEEDED,
        message: "Image upload was successful",
        imageURL
      }
    })
  } catch (err) {
    pubsub.publish("styleTransferEvent", {
      styleTransferEvent: {
        name: events.STYLIZE_ERROR,
        message: err.message
      }
    })
  }
})

const httpServer = http.createServer(app)
const apolloServer = createGraphQLServer(app, httpServer)

httpServer.listen(PORT, () => {
  console.log("Express listening on port 4001")
  console.log(
    `Apollo Server listening on port 4001 ${apolloServer.graphqlPath}`
  )
})
