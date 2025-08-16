const bodyParserOptions = {
  json: { limit: '100kb'},
  urlencoded: { limit: '100kb', extended: true },
}

module.exports = {
  server: {
    bodyParser: bodyParserOptions,
  }
}