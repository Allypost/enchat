use Mix.Config

config :enchat, ecto_repos: [Enchat.Repo]

import_config "#{Mix.env}.exs"
