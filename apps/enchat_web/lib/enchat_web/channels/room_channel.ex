defmodule EnchatWeb.RoomChannel do
  use EnchatWeb, :channel
  alias EnchatWeb.Presence

  def join("room:lobby", _data, socket) do
    send(self(), :after_join)

    {:ok, socket}
  end

  def handle_info(:after_join, socket) do
    push(socket, "presence_state", Presence.list(socket))

    broadcast_from(socket, "message:new", %{
      type: "system",
      text: socket.assigns.name <> " joined.",
      from: "System",
      sent: DateTime.to_iso8601(DateTime.utc_now())
    })

    {:ok, _} =
      Presence.track(socket, socket.assigns.name, %{
        online_at: DateTime.to_iso8601(DateTime.utc_now())
      })

    {:noreply, socket}
  end

  def handle_in("ping", _data, socket) do
    {:reply, {:ok, %{text: "pong"}}, socket}
  end

  def handle_in("message:new", data, socket) do
    message = %{
      type: "message",
      text: data["text"],
      from: socket.assigns.name,
      sent: DateTime.to_iso8601(DateTime.utc_now())
    }

    broadcast(socket, "message:new", message)
    {:reply, {:ok, %{sent: true}}, socket}
  end

  def handle_in(name, data, socket) do
    {:reply, {:error, %{sent: false, reason: "invalid room: " <> name, data: data}}, socket}
  end
end
