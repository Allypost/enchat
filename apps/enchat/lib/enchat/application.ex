defmodule Enchat.Application do
  @moduledoc """
  The Enchat Application Service.

  The enchat system business domain lives in this application.

  Exposes API to clients such as the `EnchatWeb` application
  for use in channels, controllers, and elsewhere.
  """
  use Application

  def start(_type, _args) do
    import Supervisor.Spec, warn: false

    Supervisor.start_link([
      supervisor(Enchat.Repo, []),
    ], strategy: :one_for_one, name: Enchat.Supervisor)
  end
end
