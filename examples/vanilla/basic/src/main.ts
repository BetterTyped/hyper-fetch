import "@picocss/pico/css/pico.min.css";
import "./styles.css";
import { getTodo, getTodos } from "./api";

// Plain DOM: a static skeleton, then `textContent` for everything that comes from the API.
const root = document.getElementById("root")!;
root.innerHTML = `
  <main class="container">
    <hgroup>
      <h1>Todos</h1>
      <p>HyperFetch without a framework: <code>request.send()</code> and the response object.</p>
    </hgroup>
    <div class="grid-2">
      <section>
        <h2>Latest todos</h2>
        <ul id="todos" class="list" aria-busy="true"></ul>
      </section>
      <section>
        <h2>Look up a todo</h2>
        <form id="lookup" role="group">
          <input name="todoId" type="number" min="1" value="1" aria-label="Todo id" required />
          <button type="submit">Send</button>
        </form>
        <small class="muted">Ids above 254 do not exist. Try 9999 to see an error response.</small>
        <article id="result">
          <dl class="response">
            <dt>success</dt><dd data-field="success">-</dd>
            <dt>status</dt><dd data-field="status">-</dd>
            <dt>data</dt><dd data-field="data">-</dd>
            <dt>error</dt><dd data-field="error">-</dd>
            <dt>time</dt><dd data-field="time">-</dd>
          </dl>
        </article>
      </section>
    </div>
  </main>
`;

const todoList = root.querySelector<HTMLUListElement>("#todos")!;
const form = root.querySelector<HTMLFormElement>("#lookup")!;
const result = root.querySelector<HTMLElement>("#result")!;
const field = (name: string) => result.querySelector<HTMLElement>(`[data-field="${name}"]`)!;

const listItem = (text: string) => {
  const item = document.createElement("li");
  item.textContent = text;
  return item;
};

const loadTodos = async () => {
  // send() never rejects. Network errors, timeouts and 4xx/5xx come back in `error`.
  const { data, error } = await getTodos.send({ queryParams: { limit: 5 } });
  todoList.removeAttribute("aria-busy");

  if (error || !data) {
    todoList.replaceChildren(listItem(`Could not load todos: ${error?.message}`));
    return;
  }

  todoList.replaceChildren(...data.todos.map((todo) => listItem(`${todo.completed ? "✓" : "○"} ${todo.todo}`)));
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const todoId = Number(new FormData(form).get("todoId"));

  result.setAttribute("aria-busy", "true");
  // `:todoId` in the endpoint makes `params` required and typed here.
  const response = await getTodo.send({ params: { todoId } });
  result.removeAttribute("aria-busy");

  field("success").textContent = String(response.success);
  field("status").textContent = String(response.status);
  field("data").textContent = response.data ? `#${response.data.id} ${response.data.todo}` : "null";
  field("error").textContent = response.error ? response.error.message : "null";
  field("time").textContent = `${response.responseTimestamp - response.requestTimestamp} ms`;
});

loadTodos();
