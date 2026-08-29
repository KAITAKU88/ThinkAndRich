import * as React from "react";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className: _c, ...props }, ref) => <textarea ref={ref} {...props} />
);
Textarea.displayName = "Textarea";
export { Textarea };
