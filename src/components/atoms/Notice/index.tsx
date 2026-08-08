import classes from "./Notice.module.css";

export const Notice = ({ children }: { children: React.ReactNode }) => (
  <p className={classes.notice}>{children}</p>
);
