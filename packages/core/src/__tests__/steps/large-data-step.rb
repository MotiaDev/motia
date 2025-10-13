require 'json'

def config
  {
    type: 'api',
    name: 'large-data-step-ruby',
    emits: [],
    path: '/large-ruby',
    method: 'POST'
  }
end

def handler(data, ctx)
  if data.is_a?(String)
    data.length
  else
    begin
      JSON.dump(data).length
    rescue
      0
    end
  end
end

