def config
  {
    type: "api",
    name: "large-data-step",
    emits: [],
    path: "/large-data",
    method: "POST"
  }
end

def handler(body, _ctx)
  if body.is_a?(String)
    return {
      "status" => 200,
      "body" => { "return data" => "random" }
    }
  end

  if body.respond_to?(:type) && body.type == "Buffer" && body.respond_to?(:data)
    data = body.data
    return data.length if data.respond_to?(:length)
  end

  if body.respond_to?(:length)
    begin
      return body.length
    rescue StandardError
    end
  end

  0
end
