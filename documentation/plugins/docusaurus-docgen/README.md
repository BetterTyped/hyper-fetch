# ⚙️ React Window hooks

<p>
  <a href="https://bettertyped.com/">
    <img src="https://custom-icon-badges.demolab.com/static/v1?label=&message=BetterTyped&color=333&logo=BT" />
  </a>
  <a href="https://github.com/BetterTyped/react-window-hooks">
    <img src="https://custom-icon-badges.demolab.com/github/stars/BetterTyped/react-window-hooks?logo=star&color=118ab2" />
  </a>
  <a href="https://github.com/BetterTyped/react-window-hooks/blob/main/License.md">
    <img src="https://custom-icon-badges.demolab.com/github/license/BetterTyped/react-window-hooks?logo=law&color=yellow" />
  </a>
  <a href="https://github.com/semantic-release/semantic-release">
    <img src="https://custom-icon-badges.demolab.com/badge/semver-commitzen-e10079?logo=semantic-release&color=e76f51" />
  </a>
  <a href="https://github.com/BetterTyped/react-window-hooks">
    <img src="https://custom-icon-badges.demolab.com/badge/typescript-%23007ACC.svg?logo=typescript&logoColor=white" />
  </a>
  <a href="https://www.npmjs.com/package/@better-hooks/window">
    <img src="https://custom-icon-badges.demolab.com/npm/v/@better-hooks/window.svg?logo=npm&color=E10098" />
  </a>
  <a href="https://www.npmjs.com/package/@better-hooks/window">
    <img src="https://custom-icon-badges.demolab.com/bundlephobia/minzip/@better-hooks/window?color=blueviolet&logo=package" />
  </a>
  <a href="https://www.npmjs.com/package/@better-hooks/window">
    <img src="https://custom-icon-badges.demolab.com/npm/dm/@better-hooks/window?logoColor=fff&logo=trending-up" />
  </a>
</p>

## About

Handle window events and observe window size

## Key Features

🔮 **Simple usage**

🚀 **Fast and light**

✨ **Lifecycle Window events**

💎 **Lifecycle Document events**

🎯 **Window size**

🪄 **Window scroll position**

💡 **Window focus**

🎊 **SSR Support**

## Installation

```bash
npm install --save @better-hooks/window
```

or

```bash
yarn add @better-hooks/window
```

---

## Examples

#### useWindowEvent

```tsx
import React from "react";
import { useWindowEvent } from "@better-hooks/window";

const MyComponent: React.FC = () => {
  // Unmounts event with component lifecycle
  useWindowEvent("scroll", () => {
    // ... Do something
  });

  useWindowEvent("wheel", () => {
    // ... Do something
  });

  useWindowEvent("resize", () => {
    // ... Do something
  });

  return (
    // ...
  )
}

```

---

#### useDocumentEvent

```tsx
import React from "react";
import { useDocumentEvent } from "@better-hooks/window";

const MyComponent: React.FC = () => {
  // Unmounts event with component lifecycle
  useDocumentEvent("visibilitychange", () => {
    // ... Do something
  });

  useDocumentEvent("scroll", () => {
    // ... Do something
  });

  return (
    // ...
  )
}

```

---

#### useWindowSize

```tsx
import React from "react";
import { useWindowSize } from "@better-hooks/window";

const MyComponent: React.FC = () => {
  // Updates with resizing
  const [width, height] = useWindowSize()

  return (
    // ...
  )
}

```

---

#### useWindowScroll

```tsx
import React from "react";
import { useWindowScroll } from "@better-hooks/window";

const MyComponent: React.FC = () => {
  // Updates when scrolling
  const [x, y] = useWindowScroll()

  return (
    // ...
  )
}

```

---

#### useWindowFocus

```tsx
import React from "react";
import { useWindowFocus } from "@better-hooks/window";

const MyComponent: React.FC = () => {
  // Updates when user leave our page
  const focus = useWindowFocus()

  useEffect(() => {
    if(focus) {
      // User is using our page
    } else {
      // User has minimized window or leaved our page to different tab
    }
  }, [focus])

  return (
    // ...
  )
}

```
