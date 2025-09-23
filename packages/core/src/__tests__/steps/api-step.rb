def config
    {
      name: "api-step",
      triggers: [{
        type: "api",
        path: "/test",
        method: "POST"
      }],
      emits: ["TEST_EVENT"], 
      path: "/test",
      method: "POST"
    }
  end
  
  def handler(req, ctx)
    ctx.emit({
      "topic" => "TEST_EVENT",
      "data" => { "test" => "data" }
    })
    
    {
      "status" => 200,
      "body" => { "traceId" => ctx.traceId }
    }
  end