/**
 * Client behavior for the `<blume-changelog>` custom element wrapping the
 * generated changelog timeline when its releases are semver-versioned. The
 * newest major line stays visible; every older major is collapsed into a group
 * revealed one major at a time by the "Show N.x releases" button at the bottom.
 *
 * Pure progressive enhancement: the server renders every release in document
 * order, and this element hides the older-major groups on connect — so a no-JS
 * visitor (or a crawler) still sees the complete history, and the button does
 * nothing until the script upgrades it.
 *
 * Imported for its side effect (registers the element) from the changelog page.
 */

class BlumeChangelog extends HTMLElement {
  connectedCallback() {
    const groups = [
      ...this.querySelectorAll<HTMLElement>("[data-changelog-major]"),
    ];
    const button = this.querySelector<HTMLButtonElement>(
      "[data-changelog-more]"
    );
    if (groups.length === 0 || !button) {
      return;
    }

    // Localized button template from the generated page markup (the
    // data-attribute channel); `{version}` is replaced with the major line.
    const template = this.dataset.i18nMore || "Show {version} releases";

    for (const group of groups) {
      group.hidden = true;
      // Focusable only programmatically, so revealing a group can move focus to
      // it for keyboard and screen-reader users without adding a tab stop.
      group.tabIndex = -1;
    }

    let revealed = 0;
    const sync = () => {
      const next = groups[revealed];
      if (next) {
        button.textContent = template.replace(
          "{version}",
          next.dataset.changelogLabel ?? ""
        );
        button.hidden = false;
      } else {
        button.hidden = true;
      }
    };

    button.addEventListener("click", () => {
      const next = groups[revealed];
      if (!next) {
        return;
      }
      next.hidden = false;
      revealed += 1;
      sync();
      next.focus();
    });

    sync();
  }
}

if (!customElements.get("blume-changelog")) {
  customElements.define("blume-changelog", BlumeChangelog);
}
