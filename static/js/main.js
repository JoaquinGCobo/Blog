const storageKey = "historica-theme";

const getPreferredTheme = () => {
  const storedTheme = window.localStorage.getItem(storageKey);
  if (storedTheme === "light" || storedTheme === "dark") return storedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  const toggle = document.querySelector("[data-theme-toggle]");
  const icon = document.querySelector("[data-theme-icon]");

  if (!toggle || !icon) return;

  const isDark = theme === "dark";
  toggle.setAttribute("aria-pressed", String(isDark));
  toggle.setAttribute("aria-label", isDark ? "Activar modo de día" : "Activar modo oscuro");
  icon.innerHTML = isDark
    ? `<svg viewBox="0 0 24 24" focusable="false"><path d="M12 4.75a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V5.5a.75.75 0 0 1 .75-.75Zm0 11.5a4.25 4.25 0 1 0 0-8.5 4.25 4.25 0 0 0 0 8.5Zm0 3a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V20a.75.75 0 0 1 .75-.75ZM5.5 11.25a.75.75 0 0 1 0 1.5H4a.75.75 0 0 1 0-1.5h1.5Zm16 0a.75.75 0 0 1 0 1.5H20a.75.75 0 0 1 0-1.5h1.5ZM7.05 7.05a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 1 1-1.06 1.06L7.05 8.11a.75.75 0 0 1 0-1.06Zm7.78 7.78a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 0 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 0-1.06ZM16.95 7.05a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 1 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0Zm-7.78 7.78a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 0 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0Z" fill="currentColor"></path></svg>`
    : `<svg viewBox="0 0 24 24" focusable="false"><path d="M21 12.79A9 9 0 1 1 11.21 3c-.02.27-.03.54-.03.81A7.99 7.99 0 0 0 19.19 11c.61 0 1.21-.07 1.81-.21Z" fill="currentColor"></path></svg>`;
};

const setupThemeToggle = () => {
  const toggle = document.querySelector("[data-theme-toggle]");
  if (!toggle) return;

  applyTheme(getPreferredTheme());

  toggle.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    window.localStorage.setItem(storageKey, nextTheme);
    applyTheme(nextTheme);
  });
};

const setupTocToggle = () => {
  const toggle = document.querySelector("[data-toc-toggle]");
  const panel = document.getElementById("mobile-toc-panel");

  if (!toggle || !panel) return;

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    panel.hidden = expanded;
  });
};

const renderComment = (reply) => {
  const article = document.createElement("article");
  article.className = "comment-item";

  const avatar = document.createElement("img");
  avatar.className = "comment-avatar";
  avatar.src = reply.account.avatar;
  avatar.alt = `Avatar de ${reply.account.display_name || reply.account.username}`;
  avatar.loading = "lazy";

  const body = document.createElement("div");
  const author = document.createElement("a");
  author.className = "comment-author";
  author.href = reply.url;
  author.target = "_blank";
  author.rel = "noopener noreferrer";
  author.textContent = reply.account.display_name || reply.account.username;

  const meta = document.createElement("div");
  meta.className = "comments-meta";
  const user = reply.account.acct.includes("@") ? reply.account.acct : `${reply.account.acct}`;
  meta.innerHTML = `<span>@${user}</span><span>${new Date(reply.created_at).toLocaleDateString("es-ES")}</span>`;

  const content = document.createElement("div");
  content.className = "comment-content";
  content.innerHTML = reply.content;

  body.append(author, meta, content);
  article.append(avatar, body);
  return article;
};

const setupMastodonComments = () => {
  const section = document.querySelector(".mastodon-comments[data-instance][data-status-id]");
  if (!section) return;

  const state = section.querySelector("[data-comments-state]");
  const list = section.querySelector("[data-comments-list]");
  const instance = section.dataset.instance;
  const statusId = section.dataset.statusId;

  let loaded = false;

  const loadComments = async () => {
    if (loaded) return;
    loaded = true;

    state.textContent = "Cargando comentarios...";

    try {
      const response = await fetch(`https://${instance}/api/v1/statuses/${statusId}/context`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const replies = (data.descendants || []).filter((reply) => !reply.in_reply_to_id || String(reply.in_reply_to_id) === String(statusId));

      if (!replies.length) {
        state.textContent = "Todavía no hay respuestas en Mastodon.";
        return;
      }

      state.remove();
      replies.forEach((reply) => list.appendChild(renderComment(reply)));
    } catch (error) {
      state.textContent = "No se pudieron cargar los comentarios ahora mismo.";
    }
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        loadComments();
        observer.disconnect();
      }
    });
  }, { rootMargin: "240px 0px" });

  observer.observe(section);
};

document.addEventListener("DOMContentLoaded", () => {
  setupThemeToggle();
  setupTocToggle();
  setupMastodonComments();
});
