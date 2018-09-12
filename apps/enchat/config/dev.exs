use Mix.Config

# Configure your database
config :enchat, Enchat.Repo,
  adapter: Ecto.Adapters.Postgres,
  username: "postgres",
  password: "postgres",
  database: "enchat_dev",
  hostname: "localhost",
  pool_size: 10
