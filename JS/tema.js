document.addEventListener("DOMContentLoaded", () => {
  const botao = document.getElementById("btntema");
  const body = document.body;

  const temaSalvo = localStorage.getItem("tema");

  if (temaSalvo === "light") {
    body.classList.add("light-mode");
  }

  botao.addEventListener("click", () => {
    body.classList.toggle("light-mode");

    if (body.classList.contains("light-mode")) {
      localStorage.setItem("tema", "light");
    } else {
      localStorage.setItem("tema", "dark");
    }
  });
});