// Appended to the Lua served to an executor. No user identity is inferred from a web page view.
export function presenceBootstrap(code){
  const url = `https://${process.env.API_HOST || 'api.flexozy.xyz'}/presence/${code}`;
  return `\n-- Flexozy live presence (best effort; requires an executor HTTP request function)
task.spawn(function()
  local ok = pcall(function()
    local players = game:GetService("Players")
    local http = game:GetService("HttpService")
    local send = (syn and syn.request) or http_request or request or (http and http.request)
    if type(send) ~= "function" and type(http) == "table" and type(http.post) == "function" then
      send = function(options) return http.post(options.Url, options.Body, options.Headers) end
    end
    if type(send) ~= "function" then return end
    local player = players.LocalPlayer
    if not player then return end
    while player.Parent do
      pcall(function()
        send({Url=${JSON.stringify(url)}, Method="POST", Headers={ ["Content-Type"]="application/json" }, Body=http:JSONEncode({name=player.Name, userId=player.UserId, jobId=game.JobId})})
      end)
      task.wait(30)
    end
  end)
end)
`;
}
