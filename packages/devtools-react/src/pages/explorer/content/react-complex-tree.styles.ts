import { tokens } from "theme/tokens";
import { createStyles } from "theme/use-styles.hook";

export const reactComplexTreeStyles = createStyles((isLight, css) => {
  return {
    styles: css`
      --rct-color-tree-bg: transparent;
      --rct-item-height: 28px;
      --rct-color-search-highlight-bg: #acccf1;

      --rct-color-tree-focus-outline: transparent;
      --rct-item-margin: 1px;
      --rct-item-padding: 8px;
      --rct-radius: 4px;
      --rct-bar-offset: 6px;
      --rct-bar-width: 4px;
      --rct-bar-color: #0366d6;
      --rct-focus-outline: #000000;

      --rct-color-focustree-item-selected-bg: ${isLight ? tokens.colors.light[400] : tokens.colors.dark[500]};
      --rct-color-focustree-item-hover-bg: ${isLight ? tokens.colors.light[100] : tokens.colors.dark[500]};
      --rct-color-focustree-item-hover-text: inherit;
      --rct-color-focustree-item-active-bg: ${isLight ? tokens.colors.light[200] : tokens.colors.dark[400]};
      --rct-color-focustree-item-active-text: inherit;

      --rct-arrow-size: 10px;
      --rct-arrow-container-size: 16px;
      --rct-arrow-padding: 6px;

      --rct-cursor: pointer;

      --rct-search-width: 120px;
      --rct-search-height: 16px;
      --rct-search-padding: 8px;
      --rct-search-border: #b4b7bd;
      --rct-search-border-bottom: #0366d6;
      --rct-search-bg: #f8f9fa;
      --rct-search-text: #000000;
      --rct-search-text-offset: calc(var(--rct-search-padding) * 2 + 16px);
      --rct-search-container-width: calc(
        var(--rct-search-width) + var(--rct-search-text-offset) + var(--rct-search-padding) + 2px
      );

      .rct-tree-item-button {
        padding: 0 var(--rct-item-padding) 0
          calc(var(--rct-item-padding) + var(--rct-arrow-container-size) + var(--rct-arrow-padding));
        margin-left: calc(-1 * var(--rct-arrow-size));
        cursor: var(--rct-cursor);
        transition:
          color 100ms ease-out,
          background-color 100ms ease-out;
      }

      .rct-tree-item-button:focus-visible {
        outline: 2px solid var(--rct-focus-outline);
      }

      .rct-tree-item-button:hover {
        background-color: var(--rct-color-focustree-item-hover-bg);
        color: var(--rct-color-focustree-item-hover-text);
      }

      .rct-tree-item-button:active {
        background-color: var(--rct-color-focustree-item-active-bg);
        color: var(--rct-color-focustree-item-active-text);
      }

      .rct-tree-item-title-container-selected .rct-tree-item-button {
        background-color: var(--rct-color-focustree-item-selected-bg);
        color: var(--rct-color-focustree-item-selected-text);
      }

      .rct-tree-item-title-container-selected .rct-tree-item-button::before {
        content: " ";
        position: absolute;
        top: calc(var(--rct-bar-offset) + var(--rct-item-margin));
        /* left: calc(-1 * var(--rct-bar-width));*/
        left: calc(-0.5 * var(--rct-bar-width));
        height: calc(var(--rct-item-height) - 2 * var(--rct-bar-offset));
        width: var(--rct-bar-width);
        background-color: var(--rct-bar-color);
        border-radius: 99px;
      }

      .rct-tree-item-button {
        margin-top: var(--rct-item-margin);
        margin-bottom: var(--rct-item-margin);
        position: relative;
        border-radius: var(--rct-radius);
      }

      .rct-tree-item-title-container-dragging-over .rct-tree-item-button {
        background-color: var(--rct-color-focustree-item-draggingover-bg);
        color: var(--rct-color-focustree-item-draggingover-color);
      }

      .rct-tree-item-title-container {
        border: none;
        background-color: unset !important;
      }

      .rct-tree-item-arrow {
        z-index: 1;
        margin-right: calc(-1 * var(--rct-arrow-container-size) + var(--rct-arrow-padding));
        width: var(--rct-arrow-container-size);
        height: var(--rct-arrow-container-size);
        display: flex;
        justify-content: center;
        align-content: center;
        border-radius: var(--rct-radius);
        cursor: var(--rct-cursor);
      }

      .rct-tree-item-arrow.rct-tree-item-arrow-isFolder:hover {
        background-color: var(--rct-color-focustree-item-hover-bg);
        color: var(--rct-color-focustree-item-hover-text);
      }

      .rct-tree-item-arrow svg {
        width: var(--rct-arrow-size);
      }

      .rct-tree-item-renaming-submit-button {
        border-radius: var(--rct-radius);
        visibility: hidden;
      }

      .rct-tree-drag-between-line {
        border-radius: 99px;
        height: 3px;
      }

      .rct-tree-search-input-container {
        width: var(--rct-search-container-width);
      }

      .rct-tree-search-input {
        width: var(--rct-search-width);
        height: var(--rct-search-height);
        padding: var(--rct-search-padding);
        padding-left: var(--rct-search-text-offset);
        margin: 0;
        border: 1px solid var(--rct-search-border);
        border-bottom: 2px solid var(--rct-search-border-bottom);
        border-radius: var(--rct-radius);
        background-color: var(--rct-search-bg);
        color: var(--rct-search-text);
      }

      .rct-tree-search-input:focus {
        outline: none;
      }

      .rct-tree-input-icon {
        content: url(data:image/svg+xml,%3Csvg%20stroke%3D%22currentColor%22%20fill%3D%22currentColor%22%20stroke-width%3D%220%22%20viewBox%3D%220%200%2016%2016%22%20height%3D%221em%22%20width%3D%221em%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M11.742%2010.344a6.5%206.5%200%201%200-1.397%201.398h-.001c.03.04.062.078.098.115l3.85%203.85a1%201%200%200%200%201.415-1.414l-3.85-3.85a1.007%201.007%200%200%200-.115-.1zM12%206.5a5.5%205.5%200%201%201-11%200%205.5%205.5%200%200%201%2011%200z%22%3E%3C%2Fpath%3E%3C%2Fsvg%3E);
        position: fixed;
        transform: translateY(var(--rct-search-padding)) translateX(var(--rct-search-padding));
        z-index: 1;
      }

      .rct-dark .rct-tree-input-icon {
        content: url(data:image/svg+xml,%3Csvg%20stroke%3D%22%23ffffff%22%20fill%3D%22%23ffffff%22%20stroke-width%3D%220%22%20viewBox%3D%220%200%2016%2016%22%20height%3D%221em%22%20width%3D%221em%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M11.742%2010.344a6.5%206.5%200%201%200-1.397%201.398h-.001c.03.04.062.078.098.115l3.85%203.85a1%201%200%200%200%201.415-1.414l-3.85-3.85a1.007%201.007%200%200%200-.115-.1zM12%206.5a5.5%205.5%200%201%201-11%200%205.5%205.5%200%200%201%2011%200z%22%3E%3C%2Fpath%3E%3C%2Fsvg%3E);
      }

      .rct-rtl .rct-tree-item-title-container {
        flex-direction: row-reverse;
      }
      .rct-rtl .rct-tree-item-button {
        text-align: right;
        justify-content: flex-end;
      }
      .rct-rtl .rct-tree-item-title-container {
        padding-right: var(--depthOffset, 0px);
        padding-left: 0;
      }
      .rct-rtl .rct-tree-item-title-container-selected .rct-tree-item-button::before {
        left: unset;
        right: calc(-0.5 * var(--rct-bar-width));
      }
      .rct-rtl .rct-tree-item-arrow {
        margin-left: 4px;
      }
      .rct-rtl .rct-tree-item-arrow:not(.rct-tree-item-arrow-expanded) {
        transform: rotate(180deg);
      }

      .rct-tree-root {
        font-family: sans-serif;
        background-color: var(--rct-color-tree-bg);
        padding: 4px 0;
      }

      .rct-tree-root-focus {
        outline: 1px solid var(--rct-color-tree-focus-outline);
      }

      .rct-tree-item-li {
        font-size: 0.8rem;
        list-style-type: none;
        padding: 0;
        margin: 0;
      }

      .rct-tree-item-title-container {
        display: flex;
        align-items: center;
        border-top: 1px solid transparent;
        border-bottom: 1px solid transparent;
        padding-left: var(--depthOffset, 0px);
      }

      .rct-tree-child-list {
      }
      .rct-tree-item-button {
        flex-grow: 1;
        display: flex;
        align-items: center;
        box-sizing: border-box;
        background-color: transparent;
        font-family: inherit;
        font-size: inherit;
        border: none;
        width: 100%;
        height: var(--rct-item-height);
        text-align: left;
        color: inherit;
        outline: none;
      }

      .rct-tree-item-arrow {
        width: 10px;
      }

      .rct-tree-item-arrow svg {
        width: 10px;
      }

      .rct-tree-item-arrow-path {
        fill: var(--rct-color-arrow);
      }

      .rct-tree-items-container {
        margin: 0;
        padding: 0;
      }

      .rct-tree-root:not(.rct-tree-root-focus) .rct-tree-item-title-container-selected {
        background-color: var(--rct-color-nonfocustree-item-selected-bg);
        color: var(--rct-color-nonfocustree-item-selected-text);
      }
      .rct-tree-root.rct-tree-root-focus .rct-tree-item-title-container-selected {
        background-color: var(--rct-color-focustree-item-selected-bg);
        color: var(--rct-color-focustree-item-selected-text);
      }
      .rct-tree-root.rct-tree-root-focus .rct-tree-item-title-container-focused {
        outline: none;
        border-color: var(--rct-color-focustree-item-focused-border);
      }
      .rct-tree-root:not(.rct-tree-root-focus) .rct-tree-item-title-container-focused {
        outline: none;
        border-color: var(--rct-color-nonfocustree-item-focused-border);
      }

      .rct-tree-item-title-container-dragging-over {
        background-color: var(--rct-color-focustree-item-draggingover-bg);
        color: var(--rct-color-focustree-item-draggingover-color);
      }

      .rct-tree-item-button-search-match {
        font-style: italic;
      }

      .rct-tree-item-search-highlight {
        background-color: var(--rct-color-search-highlight-bg);
      }

      .rct-tree-drag-between-line {
        position: absolute;
        right: 0;
        top: -2px;
        height: 4px;
        background-color: var(--rct-color-drag-between-line-bg);
      }

      .rct-tree-drag-between-line-top {
        top: 0;
      }

      .rct-tree-drag-between-line-bottom {
        top: -4px;
      }

      .rct-tree-search-input-container {
        position: absolute;
        top: 0;
        right: 0;
        width: 120px;
      }

      .rct-tree-search-input {
        position: fixed;
        width: 120px;
      }

      /* TODO see renaming form in multiple tree example, wraps around */
      .rct-tree-item-renaming-form {
        flex-grow: 1;
        display: flex;
      }
      .rct-tree-item-renaming-input {
        flex-grow: 1;
        background-color: inherit;
        border: none;
        color: inherit;
        outline: none;
      }
      .rct-tree-item-renaming-submit-button {
        border: none;
        background-color: var(--rct-color-renaming-input-submitbutton-bg);
        border-radius: 999px;
        color: var(--rct-color-renaming-input-submitbutton-text);
        cursor: pointer;
      }
      .rct-tree-item-renaming-submit-button:hover {
        background-color: var(--rct-color-renaming-input-submitbutton-bg-hover);
        color: var(--rct-color-renaming-input-submitbutton-text-hover);
      }
      .rct-tree-item-renaming-submit-button:active {
        background-color: var(--rct-color-renaming-input-submitbutton-bg-active);
        color: var(--rct-color-renaming-input-submitbutton-text-active);
      }
    `,
  };
});
