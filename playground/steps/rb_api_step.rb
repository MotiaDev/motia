def config
  {
    "type" => "api",
    "name" => "RubyApiStep",
    "description" => "A sample Ruby API step",
    "path" => "/rb-api",
    "method" => "GET",
    "emits" => ["ruby-api-event"],
    "bodySchema" => {
      "type" => "object",
      "properties" => {
        "rbMessage" => { "type" => "string", "description" => "A message from Ruby" }
      },
      "required" => ["rbMessage"]
    },
    "responseSchema" => {
      "200" => {
        "type" => "object",
        "properties" => {
          "rbResponse" => { "type" => "string", "description" => "A response from Ruby" }
        },
        "required" => ["rbResponse"]
      }
    }
  }
end

def handler(req, context)
  { "status" => 200, "body" => { "rbResponse" => "Hello from Ruby!" } }
end
