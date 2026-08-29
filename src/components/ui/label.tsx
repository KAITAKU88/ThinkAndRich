import * as React from "react";

const Label = React.forwardRef<HTMLLabelElement, React.ComponentProps<"label">>(
  ({ className: _c, ...props }, ref) => <label ref={ref} {...props} />
);
Label.displayName = "Label";
export { Label };
