import { escapeHtml, getFirstName } from "./format.js";

const AVATAR_COLORS = [
  "#2f6e57",
  "#6b9f8a",
  "#c17c5d",
  "#5677a4",
  "#8d6cb4",
  "#bd8c2f",
  "#397b7a",
  "#a0576c"
];

function hashString(value = "") {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getAvatarPresentation(entity = {}) {
  const name = entity.displayName || entity.name || entity.email || "User";
  const uid = entity.uid || entity.id || entity.email || name;
  const letter = getFirstName(name).slice(0, 1).toUpperCase() || "U";
  const background = AVATAR_COLORS[hashString(uid) % AVATAR_COLORS.length];

  return {
    name,
    firstName: getFirstName(name),
    letter,
    background,
    photoURL: entity.photoURL || entity.avatar || ""
  };
}

function createAvatarInnerMarkup(presentation, label) {
  const imageMarkup = presentation.photoURL
    ? `<img class="avatar__image" data-avatar-image alt="${escapeHtml(label)}" src="${escapeHtml(presentation.photoURL)}">`
    : "";

  return `
    <span class="avatar__fallback" aria-hidden="true">${escapeHtml(presentation.letter)}</span>
    ${imageMarkup}
  `;
}

export function createAvatarMarkup(entity = {}, options = {}) {
  const presentation = getAvatarPresentation(entity);
  const sizeClass = options.sizeClass || "";
  const extraClass = options.extraClass || "";
  const label = options.label || presentation.name;
  const classes = ["avatar", sizeClass, extraClass].filter(Boolean).join(" ");

  return `
    <span class="${classes}" data-avatar-root="true" style="--avatar-fallback:${presentation.background}">
      ${createAvatarInnerMarkup(presentation, label)}
    </span>
  `;
}

export function mountAvatar(node, entity = {}, options = {}) {
  if (!node) {
    return;
  }

  const presentation = getAvatarPresentation(entity);
  const label = options.label || presentation.name;
  node.style.setProperty("--avatar-fallback", presentation.background);
  node.setAttribute("aria-label", label);
  node.innerHTML = createAvatarInnerMarkup(presentation, label);
}

export function hydrateAvatarImages(root = document) {
  root.querySelectorAll("img[data-avatar-image]").forEach((image) => {
    if (image.dataset.hydrated === "true") {
      return;
    }

    const markLoaded = () => {
      image.dataset.loaded = "true";
    };
    const markFailed = () => {
      image.remove();
    };

    image.addEventListener("load", markLoaded, { once: true });
    image.addEventListener("error", markFailed, { once: true });
    if (image.complete && image.naturalWidth > 0) {
      markLoaded();
    }
    image.dataset.hydrated = "true";
  });
}
