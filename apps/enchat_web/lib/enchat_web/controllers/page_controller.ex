defmodule EnchatWeb.PageController do
  use EnchatWeb, :controller

  def index(conn, _params) do
    render conn, "index.html"
  end
end
