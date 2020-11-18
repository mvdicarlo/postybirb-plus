export class JumpableHotKeys {
  // Have to assume that all jumpable sections are on the same level
  static readonly JUMPABLE_CLASS: string = 'jumpable-section';
  static handlers = {
    JUMP_UP: JumpableHotKeys.JumpSection.bind(undefined, true),
    JUMP_DOWN: JumpableHotKeys.JumpSection.bind(undefined, false)
  };
  static keyMap = {
    JUMP_UP: 'ctrl+up',
    JUMP_DOWN: 'ctrl+down'
  };

  static JumpSection(up: boolean) {
    const current = document.activeElement;
    if (current) {
      const closest = current.className.includes(JumpableHotKeys.JUMPABLE_CLASS)
        ? current
        : current.closest(`.${JumpableHotKeys.JUMPABLE_CLASS}`);
      if (closest) {
        let jumpTarget: Element | null = null;
        if (up) {
          let prev = closest.previousElementSibling;
          while (prev) {
            if (prev.className.includes(JumpableHotKeys.JUMPABLE_CLASS)) {
              break;
            } else {
              prev = prev.previousElementSibling;
            }
          }
          jumpTarget = prev;
        } else {
          // Down
          let next = closest.nextElementSibling;
          while (next) {
            if (next.className.includes(JumpableHotKeys.JUMPABLE_CLASS)) {
              break;
            } else {
              next = next.nextElementSibling;
            }
          }
          jumpTarget = next;
        }
        if (jumpTarget) {
          JumpableHotKeys.FindFocusableElement(jumpTarget as HTMLElement).focus();
        }
      } else {
        // Find able jumpable on the screen
        const anyJumpable = document.getElementsByClassName(JumpableHotKeys.JUMPABLE_CLASS)[0];
        if (anyJumpable) {
          JumpableHotKeys.FindFocusableElement(anyJumpable as HTMLElement).focus();
        }
      }
    }
  }

  static FindFocusableElement(el: HTMLElement): HTMLElement {
    const potentialElements: HTMLElement[] = [
      el.querySelector('input') as HTMLElement,
      el.querySelector('button') as HTMLElement,
      el.querySelector('[tabindex]') as HTMLElement
    ];
    for (const e of potentialElements) {
      if (e) return e;
    }
    return el;
  }
}
