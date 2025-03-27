// Dark mode toggle
const themeToggle = document.getElementById("themeToggle");
const body = document.body;

// Check for saved theme preference
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
  body.classList.add("dark-mode");
  themeToggle.textContent = "🌙";
  for (let i = 0; i < document.getElementsByClassName("text").length; i++) {
    document.getElementsByClassName("text")[i].style.color = "white";
  }
}

themeToggle.addEventListener("click", () => {
  body.classList.toggle("dark-mode");
  if (body.classList.contains("dark-mode")) {
    console.log(document.getElementsByClassName("text"));
    for (let i = 0; i < document.getElementsByClassName("text").length; i++) {
      document.getElementsByClassName("text")[i].style.color = "white";
    }
    themeToggle.textContent = "🌙";
    localStorage.setItem("theme", "dark");
  } else {
    for (let i = 0; i < document.getElementsByClassName("text").length; i++) {
      document.getElementsByClassName("text")[i].style.color = "black";
    }
    themeToggle.textContent = "🌓";
    localStorage.setItem("theme", "light");
  }
});
