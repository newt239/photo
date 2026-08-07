import classes from "./PublicNotice.module.css";

export const PublicNotice = ({ children }: { children: React.ReactNode }) => (
  <p className={classes.notice}>{children}</p>
);
