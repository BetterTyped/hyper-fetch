/* eslint-disable no-undef */

const changeTheme = () => {
  const isDark = document?.documentElement.getAttribute("data-theme") === "dark";

  if (isDark) {
    document?.body?.classList.add("dark");
  } else {
    document?.body?.classList.remove("dark");
  }
};

const observer = new MutationObserver(() => {
  changeTheme();
});

observer.observe(document?.querySelector("html"), {
  attributes: true,
  childList: false,
  characterData: false,
});

changeTheme();
