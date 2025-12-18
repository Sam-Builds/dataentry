
  const USERS = {
    "admin": "8eb8a78ce57abb05cb59f0a8f43da5a1e06144db6f30b470832d4d6a47ce480b",
    "shaheek": "8947f899e461a0e786e2b0789e36b6b3801d75c06c1846d7550ab361501c226a",
    "rihaam": "c26a8e9f6c6f85d8cffd1b6f1eb11b3c9b26be3a249eb529d76cd354f308c5eb",
    "vyshnav": "b9270ed9d671da4c49c32c90467fec883649d5af70e9dad2d0b29e620616b27c",
    "khubaib": "466e665258265166f1964420660a9e811f019958bb819bff52b22e0dbfbac81e",
    "abhishek": "78a463d8187b791cfe00ac6f4d26d27e6c3fe59f1ffac8817ddca25d9512efab",
    "reesha": "f3b4061c380d8ec73a51fbbef02988995314faaffd039a78b1d301d4944f47d2",
  };

  const REDIRECT_URL = "/pages/main.html"; 

  async function sha256(text) {
    const data = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  }

  function showError(msg) {
    let el = document.getElementById("login-error");
    if (!el) {
      el = document.createElement("div");
      el.id = "login-error";
      el.style.color = "#ff6b6b";
      el.style.fontSize = "14px";
      el.style.marginBottom = "16px";
      el.style.textAlign = "center";
      document.querySelector("form").prepend(el);
    }
    el.textContent = msg;
  }

  // ===== LOGIN LOGIC =====
  document.querySelector("form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const remember = document.getElementById("remember").checked;

    if (!USERS[email]) {
      showError("Invalid credentials");
      return;
    }

    const hash = await sha256(password);

    if (hash !== USERS[email]) {
      showError("Invalid credentials");
      return;
    }

    const storage = remember ? localStorage : sessionStorage;
    storage.setItem("auth", "true");
    storage.setItem("user", email);

    window.location.href = REDIRECT_URL;
  });

  if (
    sessionStorage.getItem("auth") === "true" ||
    localStorage.getItem("auth") === "true"
  ) {
    window.location.href = REDIRECT_URL;
  }