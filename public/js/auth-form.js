import { signIn, signUp } from "./backend.js";

export function readSafeNext() {
  const next = new URLSearchParams(location.search).get("next");
  return /^[a-z-]+\.html$/.test(next ?? "") ? next : null;
}

export function authCard(kind, { safeNext, onSignedIn }) {
  const signin = kind === "signin";
  const card = document.createElement("section");
  card.className = "auth-card";

  const heading = document.createElement("h1");
  heading.textContent = signin ? "Sign in" : "Create an account";

  const form = document.createElement("form");
  form.className = "store-form auth-form";

  const emailLabel = document.createElement("label");
  emailLabel.htmlFor = `${kind}-email`;
  emailLabel.textContent = "Email";

  const email = document.createElement("input");
  email.id = emailLabel.htmlFor;
  email.name = "email";
  email.type = "email";
  email.autocomplete = "email";
  email.required = true;

  const passwordLabel = document.createElement("label");
  passwordLabel.htmlFor = `${kind}-password`;
  passwordLabel.textContent = "Password";

  const password = document.createElement("input");
  password.id = passwordLabel.htmlFor;
  password.name = "password";
  password.type = "password";
  password.autocomplete = signin ? "current-password" : "new-password";
  password.required = true;

  form.append(emailLabel, email);

  if (signin) {
    const labelRow = document.createElement("div");
    labelRow.className = "auth-label-row";
    const forgot = document.createElement("a");
    forgot.href = "forgot.html";
    forgot.textContent = "Forgot password?";
    labelRow.append(passwordLabel, forgot);
    form.append(labelRow, password);
  } else {
    password.minLength = 6;
    password.setAttribute("aria-describedby", "signup-password-help");
    const hint = document.createElement("p");
    hint.id = "signup-password-help";
    hint.className = "field-help";
    hint.textContent = "At least 6 characters.";
    form.append(passwordLabel, password, hint);
  }

  const button = document.createElement("button");
  button.type = "submit";
  button.className = "button button-primary auth-submit";
  button.textContent = signin ? "Sign in" : "Create account";

  const error = document.createElement("p");
  error.className = "field-error";
  error.role = "alert";
  error.hidden = true;

  form.append(button, error);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    error.hidden = true;
    button.disabled = true;
    try {
      const result = signin
        ? await signIn(email.value, password.value)
        : await signUp(email.value, password.value);
      if (!signin && !result.session) {
        const message = document.createElement("p");
        message.role = "status";
        message.textContent =
          "Check your email to confirm your account, then sign in.";
        form.replaceWith(message);
        message.tabIndex = -1;
        message.focus();
        return;
      }
      await onSignedIn(result.user ?? result.session?.user);
    } catch (problem) {
      error.textContent = problem.message;
      error.hidden = false;
    } finally {
      button.disabled = false;
    }
  });

  const switcher = document.createElement("p");
  switcher.className = "auth-switch";
  switcher.append(
    document.createTextNode(
      signin ? "New to Standard Issue? " : "Already have an account? ",
    ),
  );
  const switchLink = document.createElement("a");
  const destination = signin ? "signup.html" : "account.html";
  switchLink.href = safeNext
    ? `${destination}?next=${encodeURIComponent(safeNext)}`
    : destination;
  switchLink.textContent = signin ? "Create an account" : "Sign in";
  switcher.append(switchLink);

  card.append(heading, form, switcher);
  return card;
}

export function demoNote() {
  const note = document.createElement("p");
  note.className = "account-demo-note";
  note.textContent =
    "Demo accounts: your email stays in this browser and your password is never stored or checked. Real accounts switch on later.";
  return note;
}
