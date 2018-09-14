defmodule EnchatWeb.RoomChannelTest do
  use EnchatWeb.ChannelCase

  alias EnchatWeb.RoomChannel

  @user_name "Test"

  setup do
    {:ok, _, socket} =
      socket("user_id", %{name: @user_name})
      |> subscribe_and_join(RoomChannel, "room:lobby")

    {:ok, socket: socket}
  end

  test "ping replies with status ok", %{socket: socket} do
    ref = push(socket, "ping", %{})
    assert_reply(ref, :ok, %{"text" => "pong"})
  end

  test "message:new broadcasts to room:lobby", %{socket: socket} do
    push(socket, "message:new", %{"text" => "message text"})
    assert_broadcast("shout", %{"text" => "message text", from: @user_name})
  end
end
