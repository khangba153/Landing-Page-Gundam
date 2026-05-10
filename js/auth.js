(() => {
  "use strict";

  /*
   * Phần login/register này chỉ dùng để demo giao diện và luồng truy cập, không dùng cho hệ thống thật.
   * Dữ liệu tài khoản được lưu ở localStorage nên không có bảo mật phía server.
   */

  const USERS_KEY = "gundam-demo-users";
  const CURRENT_USER_KEY = "currentUser";
  const DEFAULT_ROLE = "Customer/User";

  function getUsers() {
    try {
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
      return Array.isArray(users) ? users : [];
    } catch (error) {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function normalizeUsername(username) {
    return String(username).trim().toLowerCase();
  }

  function findUserByUsername(username, users = getUsers()) {
    const normalizedUsername = normalizeUsername(username);
    return users.find((user) => normalizeUsername(user.username || "") === normalizedUsername);
  }

  function getFieldValue(form, fieldName) {
    return form.elements[fieldName]?.value.trim() || "";
  }

  function showMessage(messageElement, text, type = "error") {
    if (!messageElement) return;

    messageElement.textContent = text;
    messageElement.className = `auth-message auth-message--${type}`;
    messageElement.hidden = false;
  }

  function clearMessage(messageElement) {
    if (!messageElement) return;

    messageElement.textContent = "";
    messageElement.hidden = true;
  }

  function hasEmptyFields(values) {
    return values.some((value) => value.trim() === "");
  }

  function handleRegister() {
    const form = document.getElementById("register-form");
    const message = document.getElementById("register-message");

    if (!form) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      clearMessage(message);

      const fullName = getFieldValue(form, "fullName");
      const email = getFieldValue(form, "email");
      const username = getFieldValue(form, "username");
      const password = getFieldValue(form, "password");
      const confirmPassword = getFieldValue(form, "confirmPassword");

      if (hasEmptyFields([fullName, email, username, password, confirmPassword])) {
        showMessage(message, "Vui lòng nhập đầy đủ thông tin.");
        return;
      }

      if (password.length < 6) {
        showMessage(message, "Password tối thiểu 6 ký tự.");
        return;
      }

      if (password !== confirmPassword) {
        showMessage(message, "Password và Confirm Password phải trùng nhau.");
        return;
      }

      const users = getUsers();

      if (findUserByUsername(username, users)) {
        showMessage(message, "Username đã tồn tại. Vui lòng chọn username khác.");
        return;
      }

      users.push({
        fullName,
        email,
        username,
        password,
        role: DEFAULT_ROLE,
        createdAt: new Date().toISOString()
      });

      saveUsers(users);
      localStorage.removeItem(CURRENT_USER_KEY);
      sessionStorage.setItem("authNotice", "Đăng ký thành công. Vui lòng đăng nhập.");
      window.location.href = "./login.html";
    });
  }

  function handleLogin() {
    const form = document.getElementById("login-form");
    const message = document.getElementById("login-message");

    if (!form) return;

    const notice = sessionStorage.getItem("authNotice");
    if (notice) {
      showMessage(message, notice, "success");
      sessionStorage.removeItem("authNotice");
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      clearMessage(message);

      const username = getFieldValue(form, "username");
      const password = getFieldValue(form, "password");

      if (hasEmptyFields([username, password])) {
        showMessage(message, "Vui lòng nhập username và password.");
        return;
      }

      if (password.length < 6) {
        showMessage(message, "Password tối thiểu 6 ký tự.");
        return;
      }

      const user = findUserByUsername(username);

      if (!user || user.password !== password) {
        showMessage(message, "Sai tài khoản hoặc mật khẩu");
        return;
      }

      localStorage.setItem(CURRENT_USER_KEY, user.username);
      window.location.href = "./dashboard.html";
    });
  }

  function setText(id, text) {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
  }

  function handleDashboard() {
    const currentUsername = localStorage.getItem(CURRENT_USER_KEY);

    if (!currentUsername) {
      window.location.replace("./login.html");
      return;
    }

    const user = findUserByUsername(currentUsername);

    if (!user) {
      localStorage.removeItem(CURRENT_USER_KEY);
      window.location.replace("./login.html");
      return;
    }

    setText("dashboard-username", user.username);
    setText("dashboard-role", user.role || DEFAULT_ROLE);
    setText("dashboard-full-name", user.fullName || "-");
    setText("dashboard-email", user.email || "-");

    const logoutButton = document.getElementById("logout-button");
    if (logoutButton) {
      logoutButton.addEventListener("click", () => {
        localStorage.removeItem(CURRENT_USER_KEY);
        window.location.href = "./login.html";
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const page = document.body.dataset.authPage;

    if (page === "register") {
      handleRegister();
      return;
    }

    if (page === "login") {
      handleLogin();
      return;
    }

    if (page === "dashboard") {
      handleDashboard();
    }
  });
})();
