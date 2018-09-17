defmodule EnchatWeb.State do
  use GenServer

  def start_link do
    GenServer.start_link(__MODULE__, %{}, name: ChatState)
  end

  def init(state) do
    :ets.new(:chat, [:set, :public, :named_table])
    {:ok, state}
  end

  def delete(key) do
    GenServer.cast(ChatState, {:delete, key})
  end

  def get(key) do
    GenServer.call(ChatState, {:get, key})
  end

  def set(key, data) do
    GenServer.cast(ChatState, {:set, key, data})
  end

  def exists(key) do
    data = GenServer.call(ChatState, {:get, key})

    data != nil
  end

  ### Internal

  def handle_call({:get, key}, _from, state) do
    data =
      case :ets.lookup(:chat, key) do
        [] -> nil
        [{_key, value}] -> value
        [first | rest] -> [first | rest]
        _ -> :error
      end

    {:reply, data, state}
  end

  def handle_cast({:delete, key}, state) do
    :ets.delete(:chat, key)
    {:noreply, state}
  end

  def handle_cast({:set, key, value}, state) do
    :ets.insert(:chat, {key, value})
    {:noreply, state}
  end
end
