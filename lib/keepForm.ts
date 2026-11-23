import { startTransition, type FormEvent } from "react";

/**
 * Submit a form to a useActionState action WITHOUT React 19's automatic form reset,
 * so typed values survive a validation error. Keeps the clicked submit button's name/value.
 */
export function keep(action: (fd: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    const fd = new FormData(e.currentTarget, submitter);
    startTransition(() => action(fd));
  };
}
