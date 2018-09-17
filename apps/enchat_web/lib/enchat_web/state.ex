defmodule EnchatWeb.State do
  use GenServer

  @name :chat_state

  def start_link do
    GenServer.start_link(__MODULE__, %{}, name: ChatState)
  end

  def init(state) do
    :ets.new(@name, [:set, :public, :named_table])
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
    GenServer.call(ChatState, {:exists, key})
  end

  ### Internal

  def handle_call({:get, key}, _from, state) do
    data =
      case :ets.lookup(@name, key) do
        [] -> nil
        [{_key, value}] -> value
        [first | rest] -> [first | rest]
        _ -> :error
      end

    {:reply, data, state}
  end

  def handle_call({:exists, key}, _from, state) do
    exists = :ets.member(@name, key)

    {:reply, exists, state}
  end

  def handle_cast({:delete, key}, state) do
    :ets.delete(@name, key)
    {:noreply, state}
  end

  def handle_cast({:set, key, value}, state) do
    :ets.insert(@name, {key, value})
    {:noreply, state}
  end
end
